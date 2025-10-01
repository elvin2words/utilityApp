
// ufms/screens/Supervisor/HelpScreen.tsx
import React, { useState, useRef } from 'react';
import { LayoutAnimation, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from "react-native";
// import HeaderBar from "@/src/components/HeaderBar";  
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useScrollToTop } from "@react-navigation/native";

import { useThemeStore } from "@/src/lib/themeStore";
import { getThemeByMode, AppTheme } from "@/src/lib/colors";

import Constants from "expo-constants";



if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function AboutApp() {
  const ref = useRef<ScrollView>(null);

  const supportWebsite = 'https://iqal.co.zw';
  const supportWhatsApp = '+263712104928';

  const openWebsite = () => Linking.openURL(supportWebsite);
  const openWhatsApp = () => Linking.openURL(`https://wa.me/${supportWhatsApp.replace(/\D/g,'')}`);

  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggleMode);
  const nextMode = mode === "light" ? "dark" : "light";

  const theme: AppTheme = getThemeByMode(mode);


  return (
    <View style={styles.container}>
      {/* <HeaderBar role="Supervisor Interface" /> */}
      {/* <ScrollView ref={ref} contentContainerStyle={styles.container}> */}
        {/* Contact Options */}
        <View style={styles.card}>
          <Text style={styles.title}>Utility</Text>
          <View style={styles.ownerDets}>
            <View style={{flexDirection:"row", alignItems:"center", justifyContent:"center"}}>
            <Text style={styles.subText}> By </Text>
            <TouchableOpacity onPress={openWebsite}><Text style={[styles.subText, {color:"#3b82f6", fontWeight:"800"}]} > Iqal Inc.</Text></TouchableOpacity>
           </View>
           <Text style={styles.subText}>(An Intelligent Algorithm Company)</Text>
          </View>
          <Text style={styles.paragraph}>
            A Field Deployment and Fault Management integrated system for optimization of how utility providers detect, respond to, and resolve faults and work orders across electricity, water, gas, and telecomm networks. 
          </Text>
          <Text style={styles.paragraph}>
            It combines real-time fault reporting, intelligent task assignment, and mobile-first field operations to ensure fast and efficient service restoration.
          </Text>

          <TouchableOpacity style={styles.buttonOutline} onPress={openWebsite}>
            <Ionicons name="globe-outline" size={18} color="#3b82f6" style={{ marginRight: 8 }} />
            <Text style={styles.buttonOutlineText}>Visit iqal.co.zw</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>WhatsApp Contact</Text>
          </TouchableOpacity>

        </View>

        <Text style={{ color:  theme.colors.maintext, marginTop: 16 }}> App Version: {Constants.expoConfig?.version}</Text>

      {/* </ScrollView> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f9fafb',
    justifyContent:"center",
    alignItems:"center"
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    // marginBottom: 20,
    color: '#111827',
    textAlign: 'center',
  },
  card: {
    // backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  ownerDets:{
    marginBottom: 16,
  },
  subText: {
    fontSize: 14,
    color: '#51575fcb',
    justifyContent:"center",
    textAlign:"center"
  },
  paragraph: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
    textAlign:"center"
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonOutlineText: {
    color: '#3b82f6',
    fontWeight: '700',
    fontSize: 16,
  },


});
