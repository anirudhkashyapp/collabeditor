package com.collabeditor.collabeditor;

import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

public class CollabHandler extends TextWebSocketHandler {

    private static final CopyOnWriteArrayList<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private static final ConcurrentHashMap<String, ObjectNode> users = new ConcurrentHashMap<>();
    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("New user connected: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        ObjectNode data = (ObjectNode) mapper.readTree(message.getPayload());
        String type = data.get("type").asText();

        if (type.equals("join")) {
            users.put(session.getId(), data);
            broadcastUsers();
        } else if (type.equals("code")) {
            for (WebSocketSession s : sessions) {
                if (s.isOpen() && !s.getId().equals(session.getId())) {
                    s.sendMessage(message);
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        users.remove(session.getId());
        System.out.println("User disconnected: " + session.getId());
        broadcastUsers();
    }

    private void broadcastUsers() {
        try {
            ObjectNode response = mapper.createObjectNode();
            response.put("type", "users");
            ArrayNode usersArray = mapper.createArrayNode();
            for (ObjectNode user : users.values()) {
                ObjectNode u = mapper.createObjectNode();
                u.put("id", user.get("id").asText());
                u.put("color", user.get("color").asText());
                usersArray.add(u);
            }
            response.set("users", usersArray);
            String json = mapper.writeValueAsString(response);
            for (WebSocketSession s : sessions) {
                if (s.isOpen()) {
                    s.sendMessage(new TextMessage(json));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}