import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../App";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../context/ApiContext";
import ApiService from "../services/api";
// import { Button } from "singalong-ui-library";
import { Room } from "singalong-shared";

type RoomsManagementNavigationProp = StackNavigationProp<
  RootStackParamList,
  "RoomsManagement"
>;

export default function RoomsManagementScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [roomPasscode, setRoomPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation<RoomsManagementNavigationProp>();
  const { user, sessionToken, logout } = useAuth();
  const { apiUrl } = useApi();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            const api = new ApiService(apiUrl);
            api.setSessionToken(sessionToken);
            await api.logout();
          } catch (error) {
            console.error("Logout error:", error);
          } finally {
            await logout();
            navigation.replace("Login");
          }
        },
      },
    ]);
  };

  const handleCreateRoom = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const api = new ApiService(apiUrl);
      api.setSessionToken(sessionToken);

      const { room } = await api.createRoom(
        user.nickname,
        "", // Password already verified
        roomPasscode || undefined
      );

      setModalVisible(false);
      setRoomPasscode("");
      
      // Navigate to the new room's dashboard
      navigation.navigate("RoomDashboard", { roomId: room.id });
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create room"
      );
    } finally {
      setLoading(false);
    }
  };

  const openRoom = (room: Room) => {
    navigation.navigate("RoomDashboard", { roomId: room.id });
  };

  const goToSongsManagement = () => {
    navigation.navigate("SongsManagement");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, {user?.nickname}</Text>
          <Text style={styles.roleText}>Admin</Text>
        </View>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="secondary"
          size="small"
        />
      </View>

      <View style={styles.actions}>
        <Button
          title="+ Create New Room"
          onPress={() => setModalVisible(true)}
          variant="primary"
          style={styles.actionButton}
        />
        <Button
          title="📚 Manage Songs"
          onPress={goToSongsManagement}
          variant="secondary"
          style={styles.actionButton}
        />
      </View>

      {rooms.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active rooms</Text>
          <Text style={styles.emptySubtext}>Create your first room to get started</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.roomCard}
              onPress={() => openRoom(item)}
            >
              <View style={styles.roomHeader}>
                <Text style={styles.roomNumber}>Room #{item.roomNumber}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === "active"
                      ? styles.statusActive
                      : styles.statusEnded,
                  ]}
                >
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.roomInfo}>
                Session: {item.sessionStarted ? "Started" : "Not Started"}
              </Text>
              {item.passcodeProtected && (
                <Text style={styles.roomInfo}>🔒 Passcode protected</Text>
              )}
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {}} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Room</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Room Passcode (Optional)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Leave empty for no passcode"
                value={roomPasscode}
                onChangeText={setRoomPasscode}
                secureTextEntry
                autoCapitalize="none"
              />
              <Text style={styles.helperText}>
                Users will need this passcode to join the room
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setModalVisible(false);
                  setRoomPasscode("");
                }}
                variant="secondary"
                style={styles.modalButton}
                disabled={loading}
              />
              <Button
                title={loading ? "Creating..." : "Create Room"}
                onPress={handleCreateRoom}
                variant="primary"
                style={styles.modalButton}
                loading={loading}
                disabled={loading}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  roleText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  listContent: {
    padding: 16,
  },
  roomCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  roomNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6200EE",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: "#4CAF50",
  },
  statusEnded: {
    backgroundColor: "#999",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  roomInfo: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#333",
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  helperText: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
