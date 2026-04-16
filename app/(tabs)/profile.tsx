import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from 'jwt-decode';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  role: string;
}

export default function Profile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  
  const { logout, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadUserProfileFromToken();
  }, []);

  const loadUserProfileFromToken = async () => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch user data from API using the token
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.15:5000'}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      console.log('User data from API:', data);

      const userData: UserProfile = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName, 
        email: data.email,
        createdAt: data.createdAt,
        role: data.role
      };

      setUserProfile(userData);
      setFormData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
      });
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // TODO: Implement update profile API call
      Alert.alert("Success", "Profile updated successfully!");
      setEditing(false);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/(auth)/SignInScreen");
            } catch (error) {
              console.error("Logout failed:", error);
              Alert.alert("Error", "Failed to logout");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={editing ? formData.firstName : userProfile?.firstName || ""}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          editable={editing}
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={editing ? formData.lastName : userProfile?.lastName || ""}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          editable={editing}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={editing ? formData.email : userProfile?.email || ""}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          editable={editing}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Role</Text>
        <Text style={styles.roleText}>{userProfile?.role || "N/A"}</Text>

        <Text style={styles.label}>Member Since</Text>
        <Text style={styles.dateText}>
          {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : "N/A"}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {editing ? (
          <>
            <Button title="Save Changes" onPress={handleUpdateProfile} color="#0A66C2" />
            <Button 
              title="Cancel" 
              onPress={() => {
                setEditing(false);
                setFormData({
                  firstName: userProfile?.firstName || "",
                  lastName: userProfile?.lastName || "",
                  email: userProfile?.email || "",
                });
              }} 
              color="#666" 
            />
          </>
        ) : (
          <Button title="Edit Profile" onPress={() => setEditing(true)} color="#0A66C2" />
        )}
        
        <Button 
          title="Logout" 
          onPress={handleLogout} 
          color="#dc3545" 
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  roleText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#0A66C2',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    marginBottom: 20,
    color: '#666',
  },
  buttonContainer: {
    gap: 10,
  },
});