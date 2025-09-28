// ufms/screens/auth/LoginScreen.tsx

import React, { useCallback, useReducer } from "react";
import { ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";
import { Eye, EyeOff, Check, Moon, Sun } from "lucide-react-native";

import { useAuth } from "@/src/lib/auth/AuthContext";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";
import { useThemeStore } from "@/src/lib/themeStore";
import { RFValue } from "@/src/utils/RFValue";


const { width } = Dimensions.get("window");

export default function LoginScreen({ navigation }: any) {
  const {
    login,
    devLogin,
    biometricLogin,
    socialLogin,
    user,
    loading,
    loginWithGoogle, loginWithApple, loginWithFacebook 
  } = useAuth();

  const [state, setState] = useReducer(
    (prev: any, next: any) => ({ ...prev, ...next }),
    {
      email: "",
      password: "",
      rememberMe: true,
      showPassword: false,
      magicEmail: "",
      loadingMagic: false,
      loadingBio: false,
    }
  );

  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const [rememberMe, setRememberMe] = useState(true);
  // const [loading, setLoading] = useState(false);
  // const [loadingBio, setLoadingBio] = useState(false);
  // const [showPassword, setShowPassword] = useState(false);
  // const [magicEmail, setMagicEmail] = useState("");
  // const [loadingMagic, setLoadingMagic] = useState(false);

  const { email, password, rememberMe, showPassword, magicEmail, loadingMagic, loadingBio } = state;

  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggleMode);
  const nextMode = mode === "light" ? "dark" : "light";

  const theme: AppTheme = getThemeByMode(mode);

  /** Handles standard email/password login */
  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      Toast.show({ type: "error", text1: "Email and password are required" });
      return;
    }
    setState({ loading: true });
    try {
      const u = await login(email, password, rememberMe);
      Toast.show({ type: "success", text1: `Welcome back, ${u.name}!` });
      // navigation.reset({
      //   index: 0,
      //   routes: [{ name: u.role === "supervisor" ? "SupervisorDrawer" : "ArtisanStack" }],
      // }); now handled by root naviagtor 
    } catch (err: any) {
      Toast.show({ type: "error", text1: err?.message || "Login failed" });
    } finally {
      setState({ loading: false });
    }
  }, [email, password, rememberMe, login, navigation]);

  /** Handles biometric login */
  const handleBiometricLogin = useCallback(async () => {
    setState({ loadingBio: true });
    try {
      await biometricLogin();
      const u = user;
      Toast.show({ type: "success", text1: `Welcome back, ${u?.name || ""}` });
      // navigation.reset({
      //   index: 0,
      //   routes: [{ name: u?.role === "supervisor" ? "SupervisorDrawer" : "ArtisanStack" }],
      // });
    } catch (e: any) {
      Toast.show({ type: "error", text1: e?.message || "Biometric login failed" });
    } finally {
      setState({ loadingBio: false });
    }
  }, [biometricLogin, user, navigation]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={64}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.card, { backgroundColor: theme.colors.card, shadowColor: theme.colors.text }]}>
            <Text style={[styles.title, { color: theme.colors.maintext }]}>Welcome Back</Text>
 
            <TextInput
              style={[styles.input, { color: theme.colors.maintext, borderColor: theme.colors.border }]}
              placeholder="Email"
              placeholderTextColor={theme.colors.subtext}
              value={email}
              onChangeText={(t) => setState({ email: t })}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, { color: theme.colors.maintext, borderColor: theme.colors.border }]}
                placeholder="Password"
                placeholderTextColor={theme.colors.subtext}
                value={password}
                onChangeText={(t) => setState({ password: t })}
                secureTextEntry={!showPassword}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setState({ showPassword: !showPassword })}>
                {showPassword ? <EyeOff color={theme.colors.subtext} size={20} /> : <Eye color={theme.colors.subtext} size={20} />}
              </TouchableOpacity>
            </View>

            <View style={styles.rememberRow}>
              <TouchableOpacity onPress={() => setState({ rememberMe: !rememberMe })} style={styles.rememberMe}>
                {rememberMe && <Check color={theme.colors.primary} size={16} />}
                <Text style={{ marginLeft: 6, color: theme.colors.maintext }}>Remember Me</Text>
              </TouchableOpacity>

              <View style={styles.themeToggle}>
                {nextMode === "dark" ? <Moon color={theme.colors.maintext} size={16} /> : <Sun color={theme.colors.maintext} size={16} />}
                <Text style={{ marginLeft: 6, color: theme.colors.maintext }}>{nextMode === "dark" ? "Dark" : "Light"} Mode</Text>
                <Switch value={mode === "dark"} onValueChange={toggle} style={{ marginLeft: 8 }} />
              </View>
            </View>

            <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={handleLogin}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.success, marginTop: 12 }]} onPress={handleBiometricLogin}>
              {loadingBio ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login with Biometrics</Text>}
            </TouchableOpacity>

            {__DEV__ && (
              <View style={styles.linkRow}>
                <TouchableOpacity onPress={() => devLogin("supervisor")}><Text style={styles.linkText}>Dev SV Login</Text></TouchableOpacity>
                <Text style={{ color: "#aaa" }}>·</Text>
                <TouchableOpacity onPress={() => devLogin("artisan")}><Text style={styles.linkText}>Dev AS Login</Text></TouchableOpacity>
              </View>
            )}

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            {/* Magic Link Section
            <View className="mt-6">
              <Text className="text-gray-600 text-center mb-2">Or use Magic Link</Text>
              <View className="flex-row space-x-2">
                <TextInput
                  placeholder="Enter email"
                  value={magicEmail}
                  onChangeText={setMagicEmail}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3"
                  keyboardType="email-address"
                />
                <TouchableOpacity
                  onPress={handleMagicLink}
                  className="bg-gray-800 px-4 py-3 rounded-lg"
                  disabled={loadingMagic}
                >
                  {loadingMagic ? <ActivityIndicator color="#fff" /> : <Text className="text-white">Send</Text>}
                </TouchableOpacity>
              </View>
            </View> */}

            {/* Links row */}
            {/* <View style={styles.linkRow}>
              <TouchableOpacity onPress={() => Toast.show({ type: "info", text1: "Magic Link popup soon" })}>
                <Text style={styles.linkText}>Use Magic Link</Text>
              </TouchableOpacity>
              <Text style={{ color: "#aaa" }}>·</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </View> */}
            
            {/* {__DEV__ && (
              <View style={styles.linkRow}>
                  <>
                    <TouchableOpacity onPress={() => devLogin("supervisor")}>
                      <Text style={styles.linkText}>Dev SV Login</Text>
                    </TouchableOpacity>
                    <Text style={{ color: "#aaa" }}>·</Text>
                    <TouchableOpacity onPress={() => devLogin("artisan")}>
                      <Text style={styles.linkText}>Dev AS Login</Text>
                    </TouchableOpacity>
                  </>
              </View>
            )} */}

            <View style={styles.socialRow}>
              <TouchableOpacity style={[styles.socialButton, { borderColor: theme.colors.border }]} onPress={loginWithGoogle}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
              </TouchableOpacity>
              {Platform.OS === "ios" && (
                <TouchableOpacity style={[styles.socialButton, { borderColor: theme.colors.border }]} onPress={loginWithApple}>
                  <Ionicons name="logo-apple" size={20} color={theme.colors.maintext} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.socialButton, { borderColor: theme.colors.border }]} onPress={loginWithFacebook}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.versionText, { color: theme.colors.subtext }]}>App Version: {Constants.expoConfig?.version || "1.0.0"}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: width * 0.06, justifyContent: "center" },
  card: { borderRadius: RFValue(16), padding: width * 0.06, shadowOpacity: 1.2, shadowRadius: 12, elevation: 15 },
  title: { fontSize: RFValue(26), fontWeight: "bold", textAlign: "center", marginBottom: RFValue(24) },
  input: { borderWidth: 1, borderRadius: RFValue(10), paddingVertical: RFValue(12), paddingHorizontal: RFValue(16), marginBottom: RFValue(16), fontSize: RFValue(15) },
  passwordContainer: { position: "relative" },
  passwordInput: { paddingRight: RFValue(48) },
  eyeButton: { position: "absolute", right: RFValue(12), top: RFValue(14) },
  rememberRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: RFValue(16) },
  rememberMe: { flexDirection: "row", alignItems: "center" },
  themeToggle: { flexDirection: "row", alignItems: "center" },
  button: { paddingVertical: RFValue(14), borderRadius: RFValue(10), alignItems: "center" },
  buttonText: { color: "#fff", fontSize: RFValue(16), fontWeight: "600" },
  linkText: { color: "#2563EB", fontWeight: "500" },
  dividerRow: { flexDirection: "row", alignItems: "center", margin: RFValue(10) },
  divider: { flex: 1, height: 1, backgroundColor: "#ddd" },
  dividerText: { marginHorizontal: 10, color: "#777" },
  linkRow: { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 12 },
  socialRow: { flexDirection: "row", justifyContent: "center", gap: 16, marginTop: RFValue(16) },
  socialButton: { borderWidth: 1, borderRadius: 12, padding: 14, alignItems: "center", justifyContent: "center", flex: 1 },
  versionText: { marginTop: RFValue(24), textAlign: "center", fontSize: RFValue(12) },
});
