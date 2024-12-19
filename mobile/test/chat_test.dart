import 'package:flutter_test/flutter_test.dart';
import 'package:bloc_test/bloc_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import '../lib/blocs/chat/chat_bloc.dart';
import '../lib/services/api_service.dart';
import '../lib/services/chat_service.dart';
import '../lib/models/message.dart';
import '../lib/models/user.dart';

@GenerateMocks([ApiService, ChatService])
void main() {
  late MockApiService mockApiService;
  late MockChatService mockChatService;
  late ChatBloc chatBloc;

  setUp(() {
    mockApiService = MockApiService();
    mockChatService = MockChatService();
    chatBloc = ChatBloc(
      apiService: mockApiService,
      chatService: mockChatService,
    );
  });

  tearDown(() {
    chatBloc.close();
  });

  group('ChatBloc', () {
    final testUser = User(
      id: 'test_user_id',
      username: 'TestUser',
      email: 'test@example.com',
      createdAt: DateTime.now(),
    );

    final testMessage = Message(
      id: 'test_message_id',
      content: 'Test message',
      sender: testUser,
      channelId: 'test_channel_id',
      createdAt: DateTime.now(),
      type: MessageType.text,
    );

    blocTest<ChatBloc, ChatState>(
      '加入聊天时应该加载消息',
      build: () {
        when(mockApiService.getMessages(any))
            .thenAnswer((_) async => [testMessage]);
        when(mockApiService.getVoiceToken())
            .thenAnswer((_) async => 'test_token');
        return chatBloc;
      },
      act: (bloc) => bloc.add(JoinChat('test_channel_id')),
      expect: () => [
        isA<ChatLoading>(),
        isA<ChatLoaded>().having(
          (state) => state.messages,
          'messages',
          [testMessage],
        ),
      ],
    );

    blocTest<ChatBloc, ChatState>(
      '发送消息时应该更新消息列表',
      build: () {
        when(mockApiService.sendMessage(
          any,
          any,
          any,
          metadata: anyNamed('metadata'),
        )).thenAnswer((_) async => testMessage);
        return chatBloc;
      },
      seed: () => ChatLoaded(
        channelId: 'test_channel_id',
        messages: [],
        hasMore: false,
        isSearching: false,
      ),
      act: (bloc) => bloc.add(SendMessage(
        content: 'Test message',
        type: MessageType.text,
      )),
      expect: () => [
        isA<ChatLoaded>().having(
          (state) => state.messages,
          'messages',
          [testMessage],
        ),
      ],
    );

    blocTest<ChatBloc, ChatState>(
      '加载更多消息时应该追加到现有消息列表',
      build: () {
        when(mockApiService.getMessages(
          any,
          before: anyNamed('before'),
        )).thenAnswer((_) async => [testMessage]);
        return chatBloc;
      },
      seed: () => ChatLoaded(
        channelId: 'test_channel_id',
        messages: [testMessage],
        hasMore: true,
        isSearching: false,
      ),
      act: (bloc) => bloc.add(const LoadMessages(loadMore: true)),
      expect: () => [
        isA<ChatLoaded>().having(
          (state) => state.messages.length,
          'messages length',
          2,
        ),
      ],
    );

    blocTest<ChatBloc, ChatState>(
      '删除消息时应该从列表中移除',
      build: () {
        when(mockApiService.deleteMessage(any, any))
            .thenAnswer((_) async {});
        return chatBloc;
      },
      seed: () => ChatLoaded(
        channelId: 'test_channel_id',
        messages: [testMessage],
        hasMore: false,
        isSearching: false,
      ),
      act: (bloc) => bloc.add(DeleteMessage(testMessage.id)),
      expect: () => [
        isA<ChatLoaded>().having(
          (state) => state.messages,
          'messages',
          isEmpty,
        ),
      ],
    );
  });
} 