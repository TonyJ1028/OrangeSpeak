import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'dart:async';
import '../blocs/chat/chat_bloc.dart';
import '../models/message.dart';
import '../models/user.dart';

class ChatDetailScreen extends StatefulWidget {
  final String channelId;
  final String channelName;

  const ChatDetailScreen({
    super.key,
    required this.channelId,
    required this.channelName,
  });

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  bool _isEditing = false;
  String? _editingMessageId;
  Timer? _typingTimer;

  @override
  void initState() {
    super.initState();
    context.read<ChatBloc>().add(JoinChat(widget.channelId));
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _typingTimer?.cancel();
    context.read<ChatBloc>().add(LeaveChat());
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels == _scrollController.position.maxScrollExtent) {
      context.read<ChatBloc>().add(const LoadMessages(loadMore: true));
    }
  }

  void _handleTyping() {
    _typingTimer?.cancel();
    context.read<ChatBloc>().add(const UserTyping(''));
    _typingTimer = Timer(const Duration(seconds: 3), () {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.channelName),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              showSearch(
                context: context,
                delegate: MessageSearchDelegate(
                  channelId: widget.channelId,
                  bloc: context.read<ChatBloc>(),
                ),
              );
            },
          ),
        ],
      ),
      body: BlocConsumer<ChatBloc, ChatState>(
        listener: (context, state) {
          if (state is ChatError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is ChatLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (state is ChatError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(state.message),
                  ElevatedButton(
                    onPressed: () {
                      context.read<ChatBloc>().add(JoinChat(widget.channelId));
                    },
                    child: const Text('重试'),
                  ),
                ],
              ),
            );
          }

          if (state is! ChatLoaded) {
            return const Center(
              child: Text('聊天加载失败'),
            );
          }

          return Column(
            children: [
              Expanded(
                child: state.messages.isEmpty
                    ? const Center(
                        child: Text('暂无消息'),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        reverse: true,
                        itemCount: state.messages.length + (state.hasMore ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index == state.messages.length) {
                            return const Center(
                              child: Padding(
                                padding: EdgeInsets.all(8.0),
                                child: CircularProgressIndicator(),
                              ),
                            );
                          }

                          final message = state.messages[index];
                          final isCurrentUser = message.sender.id == 'current_user_id'; // TODO: 替换为实际的用户ID

                          return Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8.0,
                              vertical: 4.0,
                            ),
                            child: Row(
                              mainAxisAlignment: isCurrentUser
                                  ? MainAxisAlignment.end
                                  : MainAxisAlignment.start,
                              children: [
                                if (!isCurrentUser) ...[
                                  CircleAvatar(
                                    child: Text(message.sender.username[0].toUpperCase()),
                                  ),
                                  const SizedBox(width: 8),
                                ],
                                Flexible(
                                  child: GestureDetector(
                                    onLongPress: () {
                                      if (isCurrentUser) {
                                        _showMessageOptions(message);
                                      }
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: isCurrentUser
                                            ? Theme.of(context).primaryColor
                                            : Colors.grey[300],
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: isCurrentUser
                                            ? CrossAxisAlignment.end
                                            : CrossAxisAlignment.start,
                                        children: [
                                          if (!isCurrentUser)
                                            Text(
                                              message.sender.username,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          Text(
                                            message.content,
                                            style: TextStyle(
                                              color: isCurrentUser ? Colors.white : Colors.black,
                                            ),
                                          ),
                                          Text(
                                            _formatTime(message.createdAt),
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: isCurrentUser
                                                  ? Colors.white70
                                                  : Colors.grey[600],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        onChanged: (_) => _handleTyping(),
                        decoration: InputDecoration(
                          hintText: _isEditing ? '编辑消息...' : '输入消息...',
                          border: const OutlineInputBorder(),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                        ),
                        maxLines: null,
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Icon(_isEditing ? Icons.check : Icons.send),
                      onPressed: () {
                        if (_messageController.text.trim().isEmpty) return;
                        
                        if (_isEditing && _editingMessageId != null) {
                          context.read<ChatBloc>().add(
                                EditMessage(
                                  messageId: _editingMessageId!,
                                  content: _messageController.text.trim(),
                                ),
                              );
                          setState(() {
                            _isEditing = false;
                            _editingMessageId = null;
                          });
                        } else {
                          context.read<ChatBloc>().add(
                                SendMessage(
                                  content: _messageController.text.trim(),
                                  type: MessageType.text,
                                ),
                              );
                        }
                        _messageController.clear();
                      },
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showMessageOptions(Message message) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('编辑消息'),
              onTap: () {
                Navigator.pop(context);
                setState(() {
                  _isEditing = true;
                  _editingMessageId = message.id;
                  _messageController.text = message.content;
                });
                _messageController.selection = TextSelection(
                  baseOffset: 0,
                  extentOffset: message.content.length,
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete),
              title: const Text('删除消息'),
              onTap: () {
                Navigator.pop(context);
                context.read<ChatBloc>().add(DeleteMessage(message.id));
              },
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inDays > 0) {
      return '${difference.inDays}天前';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}小时前';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}分钟前';
    } else {
      return '刚刚';
    }
  }
}

class MessageSearchDelegate extends SearchDelegate<String> {
  final String channelId;
  final ChatBloc bloc;

  MessageSearchDelegate({
    required this.channelId,
    required this.bloc,
  });

  @override
  List<Widget> buildActions(BuildContext context) {
    return [
      IconButton(
        icon: const Icon(Icons.clear),
        onPressed: () {
          query = '';
        },
      ),
    ];
  }

  @override
  Widget buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () {
        close(context, '');
      },
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    if (query.isEmpty) return const SizedBox.shrink();

    bloc.add(SearchMessages(query));

    return BlocBuilder<ChatBloc, ChatState>(
      bloc: bloc,
      builder: (context, state) {
        if (state is! ChatLoaded) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        if (!state.isSearching) {
          return const SizedBox.shrink();
        }

        final results = state.searchResults;
        if (results == null || results.isEmpty) {
          return const Center(
            child: Text('未找到配的消息'),
          );
        }

        return ListView.builder(
          itemCount: results.length,
          itemBuilder: (context, index) {
            final message = results[index];
            return ListTile(
              leading: CircleAvatar(
                child: Text(message.sender.username[0].toUpperCase()),
              ),
              title: Text(message.sender.username),
              subtitle: Text(
                message.content,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              trailing: Text(
                _formatSearchTime(message.createdAt),
                style: const TextStyle(color: Colors.grey),
              ),
              onTap: () {
                close(context, '');
              },
            );
          },
        );
      },
    );
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    return const SizedBox.shrink();
  }

  String _formatSearchTime(DateTime time) {
    return '${time.year}-${time.month}-${time.day} ${time.hour}:${time.minute}';
  }
} 