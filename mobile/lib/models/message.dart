import 'package:equatable/equatable.dart';
import 'user.dart';

enum MessageType {
  text,
  image,
  file,
  system,
}

class Message extends Equatable {
  final String id;
  final String channelId;
  final User sender;
  final String content;
  final MessageType type;
  final DateTime createdAt;
  final bool isEdited;
  final Map<String, dynamic>? metadata;

  const Message({
    required this.id,
    required this.channelId,
    required this.sender,
    required this.content,
    required this.type,
    required this.createdAt,
    this.isEdited = false,
    this.metadata,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] as String,
      channelId: json['channelId'] as String,
      sender: User.fromJson(json['sender'] as Map<String, dynamic>),
      content: json['content'] as String,
      type: MessageType.values.firstWhere(
        (e) => e.toString() == 'MessageType.${json['type']}',
      ),
      createdAt: DateTime.parse(json['createdAt'] as String),
      isEdited: json['isEdited'] as bool? ?? false,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'channelId': channelId,
      'sender': sender.toJson(),
      'content': content,
      'type': type.toString().split('.').last,
      'createdAt': createdAt.toIso8601String(),
      'isEdited': isEdited,
      if (metadata != null) 'metadata': metadata,
    };
  }

  Message copyWith({
    String? id,
    String? channelId,
    User? sender,
    String? content,
    MessageType? type,
    DateTime? createdAt,
    bool? isEdited,
    Map<String, dynamic>? metadata,
  }) {
    return Message(
      id: id ?? this.id,
      channelId: channelId ?? this.channelId,
      sender: sender ?? this.sender,
      content: content ?? this.content,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      isEdited: isEdited ?? this.isEdited,
      metadata: metadata ?? this.metadata,
    );
  }

  @override
  List<Object?> get props => [
        id,
        channelId,
        sender,
        content,
        type,
        createdAt,
        isEdited,
        metadata,
      ];
} 