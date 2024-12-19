import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';
import '../models/message.dart';

class ChatService {
  static const String wsUrl = 'ws://127.0.0.1:3000/chat';
  
  WebSocketChannel? _channel;
  final Map<String, Function(Message)> _messageHandlers = {};
  final Map<String, Function(String)> _typingHandlers = {};
  Function(dynamic)? onError;

  Future<void> joinChannel(String channelId, String token) async {
    try {
      final uri = Uri.parse('$wsUrl/$channelId');
      _channel = WebSocketChannel.connect(uri, protocols: [token]);
      
      _channel!.stream.listen(
        (message) => _handleMessage(jsonDecode(message)),
        onError: (error) => onError?.call(error),
        onDone: () => _cleanup(),
      );
    } catch (e) {
      onError?.call(e);
    }
  }

  Future<void> leaveChannel(String channelId) async {
    await _cleanup();
  }

  void addMessageHandler(String channelId, Function(Message) handler) {
    _messageHandlers[channelId] = handler;
  }

  void removeMessageHandler(String channelId) {
    _messageHandlers.remove(channelId);
  }

  void addTypingHandler(String channelId, Function(String) handler) {
    _typingHandlers[channelId] = handler;
  }

  void removeTypingHandler(String channelId) {
    _typingHandlers.remove(channelId);
  }

  void _handleMessage(Map<String, dynamic> message) {
    final channelId = message['channelId'] as String;
    
    switch (message['type']) {
      case 'message':
        final messageHandler = _messageHandlers[channelId];
        if (messageHandler != null) {
          messageHandler(Message.fromJson(message['data']));
        }
        break;
      case 'typing':
        final typingHandler = _typingHandlers[channelId];
        if (typingHandler != null) {
          typingHandler(message['userId'] as String);
        }
        break;
      case 'error':
        onError?.call(message['message']);
        break;
    }
  }

  void _sendMessage(Map<String, dynamic> message) {
    if (_channel != null) {
      _channel!.sink.add(jsonEncode(message));
    }
  }

  Future<void> _cleanup() async {
    _channel?.sink.close();
    _channel = null;
    _messageHandlers.clear();
    _typingHandlers.clear();
  }

  void dispose() {
    _cleanup();
  }
} 