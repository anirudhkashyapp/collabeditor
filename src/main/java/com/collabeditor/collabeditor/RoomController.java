package com.collabeditor.collabeditor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    @PostMapping("/create")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, String> body) {
        String roomId = body.get("roomId");
        String password = body.get("password");

        if (roomRepository.existsByRoomId(roomId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Room ID already exists"));
        }

        Room room = new Room();
        room.setRoomId(roomId);
        room.setPassword(password);
        room.setContent("// Start coding here...");
        roomRepository.save(room);

        return ResponseEntity.ok(Map.of("message", "Room created", "roomId", roomId));
    }

    @PostMapping("/save")
    public ResponseEntity<?> saveCode(@RequestBody Map<String, String> body) {
    String roomId = body.get("roomId");
    String content = body.get("content");

    return roomRepository.findByRoomId(roomId)
        .map(room -> {
            room.setContent(content);
            roomRepository.save(room);
            return ResponseEntity.ok(Map.of("message", "Saved"));
        })
        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("error", "Room not found")));
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinRoom(@RequestBody Map<String, String> body) {
        String roomId = body.get("roomId");
        String password = body.get("password");

        return roomRepository.findByRoomId(roomId)
            .map(room -> {
                if (!room.getPassword().equals(password)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Wrong password"));
                }
                return ResponseEntity.ok(Map.of(
                    "message", "Joined successfully",
                    "roomId", roomId,
                    "content", room.getContent()
                ));
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Room not found")));
    }
}
