import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../models/message.dart';
import '../../models/user.dart';
import '../../services/chat_service.dart';
import '../../services/api_service.dart';
import 'package:logger/logger.dart';

// Events
abstract class ChatEvent extends Equatable {
  const ChatEvent();

  @override
  List<Object?> get props => [];
}

class JoinChat extends ChatEvent {
  final String channelId;

  const JoinChat(this.channelId);

  @override
  List<Object> get props => [channelId];
}

class LeaveChat extends ChatEvent {}

class LoadMessages extends ChatEvent {
  final bool loadMore;

  const LoadMessages({this.loadMore = false});

  @override
  List<Object> get props => [loadMore];
}

class SendMessage extends ChatEvent {
  final String content;
  final MessageType type;
  final Map<String, dynamic>? metadata;

  const SendMessage({
    required this.content,
    this.type = MessageType.text,
    this.metadata,
  });

  @override
  List<Object?> get props => [content, type, metadata];
}

class EditMessage extends ChatEvent {
  final String messageId;
  final String content;

  const EditMessage({
    required this.messageId,
    required this.content,
  });

  @override
  List<Object> get props => [messageId, content];
}

class DeleteMessage extends ChatEvent {
  final String messageId;

  const DeleteMessage(this.messageId);

  @override
  List<Object> get props => [messageId];
}

class MessageReceived extends ChatEvent {
  final Message message;

  const MessageReceived(this.message);

  @override
  List<Object> get props => [message];
}

class UserTyping extends ChatEvent {
  final String userId;

  const UserTyping(this.userId);

  @override
  List<Object> get props => [userId];
}

class SearchMessages extends ChatEvent {
  final String query;

  const SearchMessages(this.query);

  @override
  List<Object> get props => [query];
}

// States
abstract class ChatState extends Equatable {
  const ChatState();

  @override
  List<Object?> get props => [];
}

class ChatInitial extends ChatState {}

class ChatLoading extends ChatState {}

class ChatLoaded extends ChatState {
  final String channelId;
  final List<Message> messages;
  final bool hasMore;
  final Set<String> typingUsers;
  final bool isSearching;
  final String? searchQuery;
  final List<Message>? searchResults;

  const ChatLoaded({
    required this.channelId,
    required this.messages,
    this.hasMore = false,
    this.typingUsers = const {},
    this.isSearching = false,
    this.searchQuery,
    this.searchResults,
  });

  ChatLoaded copyWith({
    String? channelId,
    List<Message>? messages,
    bool? hasMore,
    Set<String>? typingUsers,
    bool? isSearching,
    String? searchQuery,
    List<Message>? searchResults,
  }) {
    return ChatLoaded(
      channelId: channelId ?? this.channelId,
      messages: messages ?? this.messages,
      hasMore: hasMore ?? this.hasMore,
      typingUsers: typingUsers ?? this.typingUsers,
      isSearching: isSearching ?? this.isSearching,
      searchQuery: searchQuery ?? this.searchQuery,
      searchResults: searchResults ?? this.searchResults,
    );
  }

  @override
  List<Object?> get props => [
        channelId,
        messages,
        hasMore,
        typingUsers,
        isSearching,
        searchQuery,
        searchResults,
      ];
}

class ChatError extends ChatState {
  final String message;

  const ChatError(this.message);

  @override
  List<Object> get props => [message];
}

// Bloc
class ChatBloc extends Bloc<ChatEvent, ChatState> {
  final ChatService _chatService;
  final ApiService _apiService;
  static const int _messagesPerPage = 50;
  final _logger = Logger();
  String? _currentChannelId;
  bool _isLoading = false;

  ChatBloc({
    required ChatService chatService,
    required ApiService apiService,
  })  : _chatService = chatService,
        _apiService = apiService,
        super(ChatInitial()) {
    on<JoinChat>(_onJoinChat);
    on<LeaveChat>(_onLeaveChat);
    on<LoadMessages>(_onLoadMessages);
    on<SendMessage>(_onSendMessage);
    on<EditMessage>(_onEditMessage);
    on<DeleteMessage>(_onDeleteMessage);
    on<MessageReceived>(_onMessageReceived);
    on<UserTyping>(_onUserTyping);
    on<SearchMessages>(_onSearchMessages);

    _setupChatCallbacks();
  }

  void _setupChatCallbacks() {
    _chatService.onError = (error) {
      emit(ChatError(error.toString()));
    };
  }

  Future<void> _onJoinChat(
    JoinChat event,
    Emitter<ChatState> emit,
  ) async {
    try {
      _logger.d('Joining chat channel: ${event.channelId}');
      _currentChannelId = event.channelId;
      emit(ChatLoading());

      final token = await _apiService.getVoiceToken(); // 复用语音token
      await _chatService.joinChannel(event.channelId, token);

      _chatService.addMessageHandler(event.channelId, (message) {
        add(MessageReceived(message));
      });

      _chatService.addTypingHandler(event.channelId, (userId) {
        add(UserTyping(userId));
      });

      final messages = await _apiService.getMessages(
        event.channelId,
        limit: _messagesPerPage,
      );

      _logger.d('Successfully joined chat with ${messages.length} messages');

      emit(ChatLoaded(
        channelId: event.channelId,
        messages: messages,
        hasMore: messages.length == _messagesPerPage,
      ));
    } catch (e) {
      _logger.e('Error joining chat', error: e);
      emit(ChatError('加入聊天失败: ${e.toString()}'));
    }
  }

  Future<void> _onLeaveChat(
    LeaveChat event,
    Emitter<ChatState> emit,
  ) async {
    if (state is ChatLoaded) {
      final channelId = (state as ChatLoaded).channelId;
      await _chatService.leaveChannel(channelId);
      _chatService.removeMessageHandler(channelId);
      _chatService.removeTypingHandler(channelId);
      emit(ChatInitial());
    }
  }

  Future<void> _onLoadMessages(
    LoadMessages event,
    Emitter<ChatState> emit,
  ) async {
    if (state is! ChatLoaded || _currentChannelId == null || _isLoading) {
      _logger.w('Cannot load messages: invalid state or already loading');
      return;
    }

    final currentState = state as ChatLoaded;
    if (!event.loadMore && !currentState.hasMore) {
      _logger.d('No more messages to load');
      return;
    }

    try {
      _isLoading = true;
      _logger.d('Loading messages for channel $_currentChannelId');

      final messages = await _apiService.getMessages(
        _currentChannelId!,
        before: event.loadMore ? currentState.messages.last.createdAt.millisecondsSinceEpoch : null,
        limit: _messagesPerPage,
      );

      _logger.d('Loaded ${messages.length} additional messages');

      if (event.loadMore) {
        emit(currentState.copyWith(
          messages: [...currentState.messages, ...messages],
          hasMore: messages.length == _messagesPerPage,
        ));
      } else {
        emit(currentState.copyWith(
          messages: messages,
          hasMore: messages.length == _messagesPerPage,
        ));
      }
    } catch (e) {
      _logger.e('Error loading messages', error: e);
      emit(ChatError('加载消息失败: ${e.toString()}'));
      emit(currentState);
    } finally {
      _isLoading = false;
    }
  }

  Future<void> _onSendMessage(
    SendMessage event,
    Emitter<ChatState> emit,
  ) async {
    if (state is! ChatLoaded || _currentChannelId == null) {
      _logger.w('Cannot send message: chat not loaded or no channel ID');
      return;
    }

    try {
      _logger.d('Sending message to channel $_currentChannelId');
      final currentState = state as ChatLoaded;
      final message = await _apiService.sendMessage(
        _currentChannelId!,
        event.content,
        event.type,
        metadata: event.metadata,
      );
      
      _logger.d('Message sent successfully: ${message.id}');
      emit(ChatLoaded(
        channelId: _currentChannelId!,
        messages: [message, ...currentState.messages],
        hasMore: currentState.hasMore,
        typingUsers: currentState.typingUsers,
        isSearching: false,
      ));
    } catch (e) {
      _logger.e('Error sending message', error: e);
      emit(ChatError('发送消息失败: ${e.toString()}'));
      emit(state); // 恢复到之前的状态
    }
  }

  Future<void> _onEditMessage(
    EditMessage event,
    Emitter<ChatState> emit,
  ) async {
    if (state is ChatLoaded) {
      final currentState = state as ChatLoaded;
      try {
        final editedMessage = await _apiService.editMessage(
          currentState.channelId,
          event.messageId,
          event.content,
        );
        final updatedMessages = currentState.messages.map((message) {
          return message.id == event.messageId ? editedMessage : message;
        }).toList();
        emit(currentState.copyWith(messages: updatedMessages));
      } catch (e) {
        emit(ChatError(e.toString()));
      }
    }
  }

  Future<void> _onDeleteMessage(
    DeleteMessage event,
    Emitter<ChatState> emit,
  ) async {
    if (state is ChatLoaded) {
      final currentState = state as ChatLoaded;
      try {
        await _apiService.deleteMessage(
          currentState.channelId,
          event.messageId,
        );
        final updatedMessages = currentState.messages
            .where((message) => message.id != event.messageId)
            .toList();
        emit(currentState.copyWith(messages: updatedMessages));
      } catch (e) {
        emit(ChatError(e.toString()));
      }
    }
  }

  void _onMessageReceived(
    MessageReceived event,
    Emitter<ChatState> emit,
  ) {
    if (state is ChatLoaded) {
      final currentState = state as ChatLoaded;
      if (currentState.channelId == event.message.channelId) {
        emit(currentState.copyWith(
          messages: [event.message, ...currentState.messages],
          typingUsers: currentState.typingUsers..remove(event.message.sender.id),
        ));
      }
    }
  }

  void _onUserTyping(
    UserTyping event,
    Emitter<ChatState> emit,
  ) {
    if (state is ChatLoaded) {
      final currentState = state as ChatLoaded;
      emit(currentState.copyWith(
        typingUsers: {...currentState.typingUsers, event.userId},
      ));

      // 3秒后自动移除正在输入状态
      Future.delayed(const Duration(seconds: 3), () {
        if (state is ChatLoaded) {
          final latestState = state as ChatLoaded;
          emit(latestState.copyWith(
            typingUsers: latestState.typingUsers..remove(event.userId),
          ));
        }
      });
    }
  }

  Future<void> _onSearchMessages(
    SearchMessages event,
    Emitter<ChatState> emit,
  ) async {
    if (state is ChatLoaded) {
      final currentState = state as ChatLoaded;
      if (event.query.isEmpty) {
        emit(currentState.copyWith(
          isSearching: false,
          searchQuery: null,
          searchResults: null,
        ));
        return;
      }

      try {
        final results = await _apiService.searchMessages(
          currentState.channelId,
          event.query,
        );
        emit(currentState.copyWith(
          isSearching: true,
          searchQuery: event.query,
          searchResults: results,
        ));
      } catch (e) {
        emit(ChatError(e.toString()));
      }
    }
  }

  @override
  Future<void> close() {
    if (state is ChatLoaded) {
      final channelId = (state as ChatLoaded).channelId;
      _chatService.removeMessageHandler(channelId);
      _chatService.removeTypingHandler(channelId);
    }
    return super.close();
  }
} 