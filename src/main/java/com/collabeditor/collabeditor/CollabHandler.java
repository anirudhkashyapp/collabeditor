package com.collabeditor.collabeditor;

import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

public class CollabHandler extends TextWebSocketHandler {

    private static final ConcurrentHashMap<String, CopyOnWriteArrayList<WebSocketSession>> rooms = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, ObjectNode> users = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, String> sessionRooms = new ConcurrentHashMap<>();
    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String roomId = getRoomId(session);
        rooms.computeIfAbsent(roomId, k -> new CopyOnWriteArrayList<>()).add(session);
        sessionRooms.put(session.getId(), roomId);
        System.out.println("User " + session.getId() + " joined room: " + roomId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String roomId = sessionRooms.get(session.getId());
        ObjectNode data = (ObjectNode) mapper.readTree(message.getPayload());
        String type = data.get("type").asText();

        if (type.equals("join")) {
            users.put(session.getId(), data);
            broadcastUsers(roomId);
        } else if (type.equals("code")) {
            broadcastToRoom(roomId, session, message);
        } else if (type.equals("chat")) {
            broadcastToAll(roomId, message);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String roomId = sessionRooms.remove(session.getId());
        if (roomId != null) {
            CopyOnWriteArrayList<WebSocketSession> roomSessions = rooms.get(roomId);
            if (roomSessions != null) roomSessions.remove(session);
        }
        users.remove(session.getId());
        System.out.println("User disconnected: " + session.getId());
        if (roomId != null) broadcastUsers(roomId);
    }

    private String getRoomId(WebSocketSession session) {
        String path = session.getUri().getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private void broadcastToRoom(String roomId, WebSocketSession sender, TextMessage message) throws Exception {
        CopyOnWriteArrayList<WebSocketSession> roomSessions = rooms.getOrDefault(roomId, new CopyOnWriteArrayList<>());
        for (WebSocketSession s : roomSessions) {
            if (s.isOpen() && !s.getId().equals(sender.getId())) {
                s.sendMessage(message);
            }
        }
    }

    private void broadcastToAll(String roomId, TextMessage message) throws Exception {
        CopyOnWriteArrayList<WebSocketSession> roomSessions = rooms.getOrDefault(roomId, new CopyOnWriteArrayList<>());
        for (WebSocketSession s : roomSessions) {
            if (s.isOpen()) s.sendMessage(message);
        }
    }

    private void broadcastUsers(String roomId) {
        try {
            CopyOnWriteArrayList<WebSocketSession> roomSessions = rooms.getOrDefault(roomId, new CopyOnWriteArrayList<>());
            ObjectNode response = mapper.createObjectNode();
            response.put("type", "users");
            ArrayNode usersArray = mapper.createArrayNode();
            for (WebSocketSession s : roomSessions) {
                ObjectNode user = users.get(s.getId());
                if (user != null) {
                    ObjectNode u = mapper.createObjectNode();
                    u.put("id", user.get("id").asText());
                    u.put("color", user.get("color").asText());
                    u.put("name", user.get("name").asText());
                    usersArray.add(u);
                }
            }
            response.set("users", usersArray);
            String json = mapper.writeValueAsString(response);
            for (WebSocketSession s : roomSessions) {
                if (s.isOpen()) s.sendMessage(new TextMessage(json));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}