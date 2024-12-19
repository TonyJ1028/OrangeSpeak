import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../models/auth/login_dto.dart';
import '../models/auth/register_dto.dart';

class AuthService {
  static const String baseUrl = 'YOUR_API_BASE_URL';

  Future<Map<String, dynamic>> login(LoginDto loginDto) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(loginDto.toJson()),
    );

    if (response.statusCode == 201) {
      final Map<String, dynamic> data = jsonDecode(response.body);
      return {
        'token': data['token'],
        'user': User.fromJson(data['user']),
      };
    } else {
      throw Exception('登录失败');
    }
  }

  Future<Map<String, dynamic>> register(RegisterDto registerDto) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(registerDto.toJson()),
    );

    if (response.statusCode == 201) {
      final Map<String, dynamic> data = jsonDecode(response.body);
      return {
        'token': data['token'],
        'user': User.fromJson(data['user']),
      };
    } else {
      throw Exception('注册失败');
    }
  }
} 