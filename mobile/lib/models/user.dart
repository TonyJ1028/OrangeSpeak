import 'package:equatable/equatable.dart';

class User extends Equatable {
  final String id;
  final String username;
  final String? email;
  final String? avatar;
  final bool isOnline;
  final DateTime createdAt;
  final DateTime? lastSeen;

  const User({
    required this.id,
    required this.username,
    this.email,
    this.avatar,
    this.isOnline = false,
    required this.createdAt,
    this.lastSeen,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String?,
      avatar: json['avatar'] as String?,
      isOnline: json['isOnline'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      lastSeen: json['lastSeen'] != null
          ? DateTime.parse(json['lastSeen'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'avatar': avatar,
      'isOnline': isOnline,
      'createdAt': createdAt.toIso8601String(),
      'lastSeen': lastSeen?.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [
        id,
        username,
        email,
        avatar,
        isOnline,
        createdAt,
        lastSeen,
      ];
} 