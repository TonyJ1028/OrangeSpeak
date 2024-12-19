import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logger/logger.dart';
import '../models/user.dart';
import '../models/channel.dart';
import '../models/message.dart';

class ApiService {
  static const String baseUrl = 'http://127.0.0.1:3000/api';
  static const String tokenKey = 'auth_token';
  final Dio _dio;
  final SharedPreferences _prefs;
  final _logger = Logger();

  ApiService._({
    required Dio dio,
    required SharedPreferences prefs,
  })  : _dio = dio,
        _prefs = prefs;

  static Future<ApiService> create() async {
    final prefs = await SharedPreferences.getInstance();
    final dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 3),
    ));
    
    // 添加日志拦截器
    dio.interceptors.add(LogInterceptor(
      request: true,
      requestHeader: true,
      requestBody: true,
      responseHeader: true,
      responseBody: true,
      error: true,
    ));
    
    // 从本地存储中获取token
    final token = prefs.getString(tokenKey);
    if (token != null) {
      dio.options.headers['Authorization'] = 'Bearer $token';
    }
    
    return ApiService._(dio: dio, prefs: prefs);
  }

  Future<User> login(String username, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'username': username,
        'password': password,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final token = response.data['token'] as String;
        await _saveToken(token);
        return User.fromJson(response.data['user']);
      } else {
        throw Exception('登录失败');
      }
    } catch (e) {
      throw Exception('登录失败: ${e.toString()}');
    }
  }

  Future<void> logout() async {
    try {
      await _prefs.remove(tokenKey);
      _dio.options.headers.remove('Authorization');
    } catch (e) {
      throw Exception('登出失败: ${e.toString()}');
    }
  }

  Future<User> register(String username, String password, String? email) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'username': username,
        'password': password,
        if (email != null) 'email': email,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final token = response.data['token'] as String;
        await _saveToken(token);
        return User.fromJson(response.data['user']);
      } else {
        throw Exception('注册失败');
      }
    } catch (e) {
      throw Exception('注册失败: ${e.toString()}');
    }
  }

  Future<List<Channel>> getChannels() async {
    try {
      final response = await _dio.get('/channels');
      if (response.statusCode == 200) {
        final channels = (response.data as List<dynamic>)
            .map((e) => Channel.fromJson(e as Map<String, dynamic>))
            .toList();
        return channels;
      } else {
        throw Exception('获取频道列表失败');
      }
    } catch (e) {
      throw Exception('获取频道列表失败: ${e.toString()}');
    }
  }

  Future<Channel> createChannel({
    required String name,
    String? description,
    required bool isVoiceChannel,
  }) async {
    try {
      final response = await _dio.post('/channels', data: {
        'name': name,
        'description': description,
        'isVoiceChannel': isVoiceChannel,
      });
      if (response.statusCode == 201) {
        return Channel.fromJson(response.data);
      } else {
        throw Exception('创建频道失败');
      }
    } catch (e) {
      throw Exception('创建频道失败: ${e.toString()}');
    }
  }

  Future<void> joinChannel(String channelId) async {
    try {
      final response = await _dio.post('/channels/$channelId/join');
      if (response.statusCode != 200) {
        throw Exception('加入频道失败');
      }
    } catch (e) {
      throw Exception('加入频道失败: ${e.toString()}');
    }
  }

  Future<void> leaveChannel(String channelId) async {
    try {
      final response = await _dio.post('/channels/$channelId/leave');
      if (response.statusCode != 200) {
        throw Exception('离开频道失败');
      }
    } catch (e) {
      throw Exception('离开频道失败: ${e.toString()}');
    }
  }

  Future<String> getVoiceToken() async {
    try {
      final response = await _dio.get('/voice/token');
      if (response.statusCode == 200) {
        return response.data['token'] as String;
      } else {
        throw Exception('获取语音token失败');
      }
    } catch (e) {
      throw Exception('获取语音token失败: ${e.toString()}');
    }
  }

  Future<List<User>> getChannelUsers(String channelId) async {
    try {
      final response = await _dio.get('/channels/$channelId/users');
      if (response.statusCode == 200) {
        final users = (response.data as List<dynamic>)
            .map((e) => User.fromJson(e as Map<String, dynamic>))
            .toList();
        return users;
      } else {
        throw Exception('获取频道用户列表失败');
      }
    } catch (e) {
      throw Exception('获取频道用户列表失败: ${e.toString()}');
    }
  }

  Future<void> _saveToken(String token) async {
    await _prefs.setString(tokenKey, token);
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  // 消息相关
  Future<List<Message>> getMessages(String channelId, {int? before, int limit = 50}) async {
    try {
      _logger.d('Getting messages for channel: $channelId, before: $before, limit: $limit');
      final response = await _dio.get(
        '/channels/$channelId/messages',
        queryParameters: {
          if (before != null) 'before': before,
          'limit': limit,
        },
      );
      if (response.statusCode == 200) {
        final messages = (response.data as List<dynamic>)
            .map((e) => Message.fromJson(e as Map<String, dynamic>))
            .toList();
        _logger.d('Retrieved ${messages.length} messages');
        return messages;
      } else {
        _logger.e('Failed to get messages: ${response.statusCode}');
        throw Exception('获取消息列表失败');
      }
    } catch (e) {
      _logger.e('Error getting messages', error: e);
      throw Exception('获取消息列表失败: ${e.toString()}');
    }
  }

  Future<Message> sendMessage(String channelId, String content, MessageType type, {Map<String, dynamic>? metadata}) async {
    try {
      _logger.d('Sending message to channel: $channelId, content: $content');
      final response = await _dio.post('/channels/$channelId/messages', data: {
        'content': content,
        'type': type.toString().split('.').last,
        if (metadata != null) 'metadata': metadata,
      });
      if (response.statusCode == 201) {
        final message = Message.fromJson(response.data);
        _logger.d('Message sent successfully: ${message.id}');
        return message;
      } else {
        _logger.e('Failed to send message: ${response.statusCode}');
        throw Exception('发送消息失败');
      }
    } catch (e) {
      _logger.e('Error sending message', error: e);
      throw Exception('发送消息失败: ${e.toString()}');
    }
  }

  Future<Message> editMessage(String channelId, String messageId, String content) async {
    try {
      final response = await _dio.put('/channels/$channelId/messages/$messageId', data: {
        'content': content,
      });
      if (response.statusCode == 200) {
        return Message.fromJson(response.data);
      } else {
        throw Exception('编辑消息失败');
      }
    } catch (e) {
      throw Exception('编辑消息失败: ${e.toString()}');
    }
  }

  Future<void> deleteMessage(String channelId, String messageId) async {
    try {
      final response = await _dio.delete('/channels/$channelId/messages/$messageId');
      if (response.statusCode != 200) {
        throw Exception('删除消息失败');
      }
    } catch (e) {
      throw Exception('删除消息失败: ${e.toString()}');
    }
  }

  Future<List<Message>> searchMessages(String channelId, String query) async {
    try {
      final response = await _dio.get(
        '/channels/$channelId/messages/search',
        queryParameters: {'q': query},
      );
      if (response.statusCode == 200) {
        final messages = (response.data as List<dynamic>)
            .map((e) => Message.fromJson(e as Map<String, dynamic>))
            .toList();
        return messages;
      } else {
        throw Exception('搜索消息失败');
      }
    } catch (e) {
      throw Exception('搜索消息失败: ${e.toString()}');
    }
  }
} 