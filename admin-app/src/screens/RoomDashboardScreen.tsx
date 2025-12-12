import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../context/ApiContext";
import { useResponsive } from "../hooks/useResponsive";
import ApiService from "../services/api";
// import { Button } from "singalong-ui-library";
import { Room, ReservedSong, User } from "singalong-shared";

type RoomDashboardRouteProp = RouteProp<RootStackParamList, "RoomDashboard">;

export default function RoomDashboardScreen() {
  const route = useRoute<RoomDashboardRouteProp>();
  const { roomId } = route.params;

  const [room, setRoom] = useState<Room | null>(null);
  const [queue, setQueue] = useState<ReservedSong[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [selectedTab, setSelectedTab] = useState<"controls" | "queue" | "users">(
    "controls"
  );

  const { sessionToken } = useAuth();
  const { apiUrl } = useApi();
  const { isDesktop } = useResponsive();

  useEffect(() => {
    loadRoomData();
  }, [roomId]);

  const loadRoomData = async () => {
    try {
      const api = new ApiService(apiUrl);
      api.setSessionToken(sessionToken);

      const [roomData, queueData] = await Promise.all([
        api.getSession(roomId),
        api.getQueue(roomId),
      ]);

      setRoom(roomData);
      setQueue(queueData.queue);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load room data"
      );
    }
  };

  const handleStartSession = async () => {
    try {
      const api = new ApiService(apiUrl);
      api.setSessionToken(sessionToken);
      await api.startSession(roomId);
      await loadRoomData();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to start session"
      );
    }
  };

  const handleEndRoom = async () => {
    Alert.alert("End Room", "Are you sure you want to end this room?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Room",
        style: "destructive",
        onPress: async () => {
          try {
            const api = new ApiService(apiUrl);
            api.setSessionToken(sessionToken);
            await api.endRoom(roomId);
            // TODO: Navigate back
          } catch (error) {
            Alert.alert(
              "Error",
              error instanceof Error ? error.message : "Failed to end room"
            );
          }
        },
      },
    ]);
  };

  const handlePlayPause = async (queueItemId: string) => {
    try {
      const api = new ApiService(apiUrl);
      api.setSessionToken(sessionToken);
      await api.playPause(roomId, queueItemId);
      await loadRoomData();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to toggle playback"
      );
    }
  };

  const handleSkip = async (queueItemId: string) => {
    try {
      const api = new ApiService(apiUrl);
      api.setSessionToken(sessionToken);
      await api.skipSong(roomId, queueItemId);
      await loadRoomData();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to skip song"
      );
    }
  };

  if (!room) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const renderControlsPanel = () => (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Room Controls</Text>
      <View style={styles.roomInfo}>
        <Text style={styles.roomNumber}>Room #{room.roomNumber}</Text>
        <Text style={styles.roomStatus}>
          Status: {room.sessionStarted ? "Active" : "Not Started"}
        </Text>
      </View>

      <View style={styles.controlButtons}>
        {!room.sessionStarted ? (
          <Button
            title="Start Session"
            onPress={handleStartSession}
            variant="primary"
            style={styles.controlButton}
          />
        ) : (
          <Button
            title="End Room"
            onPress={handleEndRoom}
            variant="danger"
            style={styles.controlButton}
          />
        )}
      </View>

      {room.qrCode && (
        <View style={styles.qrSection}>
          <Text style={styles.qrLabel}>Users can scan to join:</Text>
          <Text style={styles.qrCode}>[QR Code: {room.qrCode}]</Text>
        </View>
      )}
    </View>
  );

  const renderQueuePanel = () => (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Queue ({queue.length})</Text>
      {queue.length === 0 ? (
        <Text style={styles.emptyText}>No songs in queue</Text>
      ) : (
        <FlatList
          data={queue}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.queueItem}>
              <View style={styles.queueInfo}>
                <Text style={styles.queueIndex}>#{index + 1}</Text>
                <View style={styles.queueDetails}>
                  <Text style={styles.queueSong}>Song ID: {item.songId}</Text>
                  <Text style={styles.queueUser}>By: {item.reservedBy}</Text>
                  <Text style={styles.queueStatus}>Status: {item.status}</Text>
                </View>
              </View>
              {item.status === "playing" && (
                <View style={styles.queueActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handlePlayPause(item.id)}
                  >
                    <Text>⏸️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleSkip(item.id)}
                  >
                    <Text>⏭️</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          scrollEnabled={!isDesktop}
          style={styles.queueList}
        />
      )}
    </View>
  );

  const renderUsersPanel = () => (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Participants ({participants.length})</Text>
      {participants.length === 0 ? (
        <Text style={styles.emptyText}>No participants yet</Text>
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <Text style={styles.userName}>{item.nickname}</Text>
              <Text style={styles.userRole}>{item.role}</Text>
            </View>
          )}
          scrollEnabled={!isDesktop}
          style={styles.userList}
        />
      )}
    </View>
  );

  if (isDesktop) {
    // Desktop: Multi-panel grid layout
    return (
      <ScrollView style={styles.container}>
        <View style={styles.desktopGrid}>
          <View style={styles.desktopColumn}>
            {renderControlsPanel()}
            {renderUsersPanel()}
          </View>
          <View style={styles.desktopColumn}>{renderQueuePanel()}</View>
        </View>
      </ScrollView>
    );
  }

  // Mobile: Tab-based navigation
  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "controls" && styles.activeTab]}
          onPress={() => setSelectedTab("controls")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "controls" && styles.activeTabText,
            ]}
          >
            Controls
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "queue" && styles.activeTab]}
          onPress={() => setSelectedTab("queue")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "queue" && styles.activeTabText,
            ]}
          >
            Queue
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "users" && styles.activeTab]}
          onPress={() => setSelectedTab("users")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "users" && styles.activeTabText,
            ]}
          >
            Users
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContent}>
        {selectedTab === "controls" && renderControlsPanel()}
        {selectedTab === "queue" && renderQueuePanel()}
        {selectedTab === "users" && renderUsersPanel()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  desktopGrid: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  desktopColumn: {
    flex: 1,
    gap: 16,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#6200EE",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  activeTabText: {
    color: "#6200EE",
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  panel: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  roomInfo: {
    marginBottom: 16,
  },
  roomNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6200EE",
    marginBottom: 4,
  },
  roomStatus: {
    fontSize: 14,
    color: "#666",
  },
  controlButtons: {
    gap: 12,
    marginBottom: 16,
  },
  controlButton: {
    marginBottom: 8,
  },
  qrSection: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    alignItems: "center",
  },
  qrLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  qrCode: {
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 32,
  },
  queueList: {
    maxHeight: 400,
  },
  queueItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  queueInfo: {
    flexDirection: "row",
    flex: 1,
  },
  queueIndex: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6200EE",
    marginRight: 12,
    minWidth: 30,
  },
  queueDetails: {
    flex: 1,
  },
  queueSong: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  queueUser: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  queueStatus: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  queueActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
  },
  userList: {
    maxHeight: 300,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  userRole: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
  },
});
