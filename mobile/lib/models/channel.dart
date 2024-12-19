import 'package:equatable/equatable.dart';
import 'user.dart';

class Channel extends Equatable {
  final String id;
  final String name;
  final String? description;
  final List<User> users;
  final bool isVoiceChannel;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const Channel({
    required this.id,
    required this.name,
    this.description,
    required this.users,
    required this.isVoiceChannel,
    required this.createdAt,
    this.updatedAt,
  });

  factory Channel.fromJson(Map<String, dynamic> json) {
    return Channel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      users: (json['users'] as List<dynamic>)
          .map((e) => User.fromJson(e as Map<String, dynamic>))
          .toList(),
      isVoiceChannel: json['isVoiceChannel'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'users': users.map((e) => e.toJson()).toList(),
      'isVoiceChannel': isVoiceChannel,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [
        id,
        name,
        description,
        users,
        isVoiceChannel,
        createdAt,
        updatedAt,
      ];
} 