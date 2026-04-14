package com.collabeditor.collabeditor;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String roomId;

    @Column(nullable = false)
    private String password;

    @Column(columnDefinition = "TEXT")
    private String content;
}
