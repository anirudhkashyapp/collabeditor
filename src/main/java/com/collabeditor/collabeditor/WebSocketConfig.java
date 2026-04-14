package com.collabeditor.collabeditor;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final CollabHandler collabHandler = new CollabHandler();

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(collabHandler, "/collab/**")
                .setAllowedOrigins("*");
    }
}
