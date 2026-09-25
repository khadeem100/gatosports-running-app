import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Alert, Share } from 'react-native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { api, hasApi } from '@/lib/api';
import { secureSession } from '@/lib/auth-storage';
import { useRunSession } from '@/hooks/run-session';

type ActiveSafetySession = { id: string; shareUrl: string };
type SafetyContextValue = {
  activeSession: ActiveSafetySession | null;
  starting: boolean;
  startLive: () => Promise<boolean>;
  shareLive: () => Promise<void>;
  endLive: () => Promise<void>;
  shareCurrentLocation: () => Promise<void>;
};

const KEY = 'gato-running-live-safety-session';
const LAST_UPDATE_KEY = 'gato-running-live-safety-last-update';
const SafetyContext = createContext<SafetyContextValue | null>(null);

export function SafetySessionProvider({ children }: PropsWithChildren) {
  const { status } = useRunSession();
  const [activeSession, setActiveSession] = useState<ActiveSafetySession | null>(null);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void SecureStore.getItemAsync(KEY).then((raw) => {
      if (raw) setActiveSession(JSON.parse(raw) as ActiveSafetySession);
    }).catch(() => undefined).finally(() => setReady(true));
  }, []);

  const startLive = useCallback(async () => {
    if (status !== 'running' && status !== 'paused') {
      Alert.alert('Start eerst je run', 'Live Safety Mode is beschikbaar zodra je run is gestart. Een eenmalige check-in kun je altijd delen.');
      return false;
    }
    if (!hasApi || !(await secureSession.getToken())) {
      Alert.alert('Account nodig', 'Log in en verbind de GatoSports Running API om een tijdelijke live-deellink te starten. Je kunt wel je huidige plek eenmalig delen.');
      return false;
    }
    setStarting(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Locatie nodig', 'Sta locatie toe om tijdens deze run je positie met je vertrouwde contact te delen.');
        return false;
      }
      const session = await api.startSafetySession();
      await SecureStore.deleteItemAsync(LAST_UPDATE_KEY);
      await SecureStore.setItemAsync(KEY, JSON.stringify(session));
      setActiveSession(session);
      await Share.share({ message: `Mijn GatoSports Safety Mode is actief. Volg mijn run hier: ${session.shareUrl}`, url: session.shareUrl });
      return true;
    } catch {
      Alert.alert('Delen niet gestart', 'We konden de beveiligde deel-link nu niet maken. Probeer het opnieuw wanneer je verbinding hebt.');
      return false;
    } finally { setStarting(false); }
  }, [status]);

  const shareLive = useCallback(async () => {
    if (!activeSession) return;
    try { await Share.share({ message: `Volg mijn GatoSports run: ${activeSession.shareUrl}`, url: activeSession.shareUrl }); }
    catch { Alert.alert('Delen niet gelukt', 'Probeer de deel-link nog eens te versturen.'); }
  }, [activeSession]);

  const endLive = useCallback(async () => {
    if (!activeSession) return;
    try { await api.endSafetySession(activeSession.id); } catch { /* The share expires automatically after its short safety window. */ }
    await SecureStore.deleteItemAsync(KEY);
    await SecureStore.deleteItemAsync(LAST_UPDATE_KEY);
    setActiveSession(null);
  }, [activeSession]);

  const shareCurrentLocation = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Locatie niet gedeeld', 'Je kunt deze check-in delen als je locatie toestaat.');
        return;
      }
      const point = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = point.coords;
      const mapUrl = `https://www.openstreetmap.org/?mlat=${latitude.toFixed(5)}&mlon=${longitude.toFixed(5)}#map=16/${latitude.toFixed(5)}/${longitude.toFixed(5)}`;
      await Share.share({ message: `Dit is mijn huidige plek. Dit is een eenmalige check-in, geen live tracking: ${mapUrl}`, url: mapUrl });
    } catch {
      Alert.alert('Locatie niet beschikbaar', 'Ga naar buiten of controleer je locatie-instellingen en probeer het opnieuw.');
    }
  }, []);

  useEffect(() => {
    if (!ready || !activeSession || status === 'idle') return;
    if (status === 'completed') {
      const timer = setTimeout(() => { void endLive(); }, 0);
      return () => clearTimeout(timer);
    }
    if (status !== 'running') return;
    let active = true;
    const update = async () => {
      try {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, mayShowUserSettingsDialog: false });
        if (active && location.coords.accuracy !== null && location.coords.accuracy < 100) {
          await api.updateSafetySession(activeSession.id, location.coords.latitude, location.coords.longitude);
        }
      } catch { /* The runner can keep moving; the last safe location stays visible. */ }
    };
    void update();
    const timer = setInterval(() => { void update(); }, 15_000);
    return () => { active = false; clearInterval(timer); };
  }, [activeSession, endLive, ready, status]);

  const value = useMemo(() => ({ activeSession, starting, startLive, shareLive, endLive, shareCurrentLocation }), [activeSession, starting, startLive, shareLive, endLive, shareCurrentLocation]);
  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
}

export function useSafetySession() {
  const value = useContext(SafetyContext);
  if (!value) throw new Error('useSafetySession must be used inside SafetySessionProvider');
  return value;
}
