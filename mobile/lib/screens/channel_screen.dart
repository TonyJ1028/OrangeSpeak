import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import '../blocs/channel/channel_bloc.dart';
import '../models/channel.dart';
import 'voice_screen.dart';
import 'chat_detail_screen.dart';

class ChannelScreen extends StatefulWidget {
  const ChannelScreen({super.key});

  @override
  State<ChannelScreen> createState() => _ChannelScreenState();
}

class _ChannelScreenState extends State<ChannelScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    context.read<ChannelBloc>().add(LoadChannels());
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<ChannelBloc, ChannelState>(
      listener: (context, state) {
        if (state is ChannelError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
      },
      child: Column(
        children: [
          _buildSearchBar(),
          TabBar(
            controller: _tabController,
            tabs: const [
              Tab(
                icon: Icon(Icons.volume_up),
                text: '语音频道',
              ),
              Tab(
                icon: Icon(Icons.chat),
                text: '文字频道',
              ),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildChannelList(true),
                _buildChannelList(false),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: EdgeInsets.all(16.w),
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: '搜索频道',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        setState(() {
                          _searchController.clear();
                          _searchQuery = '';
                        });
                      },
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10.r),
              ),
            ),
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
            },
          ),
          SizedBox(height: 16.h),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => _showCreateChannelDialog(true),
                  icon: const Icon(Icons.add),
                  label: const Text('创建语音频道'),
                ),
              ),
              SizedBox(width: 16.w),
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => _showCreateChannelDialog(false),
                  icon: const Icon(Icons.add),
                  label: const Text('创建文字频道'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChannelList(bool isVoiceChannel) {
    return BlocBuilder<ChannelBloc, ChannelState>(
      builder: (context, state) {
        if (state is ChannelLoading) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }
        if (state is ChannelLoaded) {
          final filteredChannels = state.channels.where((channel) {
            final matchesType = channel.isVoiceChannel == isVoiceChannel;
            final matchesQuery = _searchQuery.isEmpty ||
                channel.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                (channel.description?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
            return matchesType && matchesQuery;
          }).toList();

          if (filteredChannels.isEmpty) {
            return Center(
              child: Text(
                _searchQuery.isEmpty
                    ? '暂无${isVoiceChannel ? "语音" : "文字"}频道，点击上方按钮创建'
                    : '未找到匹配的频道',
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              context.read<ChannelBloc>().add(LoadChannels());
            },
            child: ListView.builder(
              padding: EdgeInsets.symmetric(horizontal: 16.w),
              itemCount: filteredChannels.length,
              itemBuilder: (context, index) {
                final channel = filteredChannels[index];
                return _buildChannelCard(channel);
              },
            ),
          );
        }
        return const Center(
          child: Text('加载失败，下拉刷新重试'),
        );
      },
    );
  }

  Widget _buildChannelCard(Channel channel) {
    final onlineUsers = channel.users.where((user) => user.isOnline).length;
    
    return Card(
      margin: EdgeInsets.only(bottom: 8.h),
      child: ListTile(
        leading: Icon(
          channel.isVoiceChannel ? Icons.volume_up : Icons.chat,
          color: Theme.of(context).colorScheme.primary,
        ),
        title: Text(channel.name),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (channel.description != null)
              Text(
                channel.description!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            Text(
              '$onlineUsers/${channel.users.length} 位用户在线',
              style: TextStyle(
                color: Theme.of(context).colorScheme.primary,
                fontSize: 12.sp,
              ),
            ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (channel.isVoiceChannel)
              IconButton(
                icon: const Icon(Icons.mic),
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => VoiceScreen(
                        channelId: channel.id,
                        channelName: channel.name,
                      ),
                    ),
                  );
                },
              ),
            IconButton(
              icon: const Icon(Icons.info_outline),
              onPressed: () {
                _showChannelInfoDialog(channel);
              },
            ),
          ],
        ),
        onTap: () {
          if (!channel.isVoiceChannel) {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => ChatDetailScreen(
                  channelId: channel.id,
                  channelName: channel.name,
                ),
              ),
            );
          }
        },
      ),
    );
  }

  Future<void> _showCreateChannelDialog(bool isVoiceChannel) async {
    final nameController = TextEditingController();
    final descriptionController = TextEditingController();

    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('创建${isVoiceChannel ? "语音" : "文字"}频道'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: '频道名称',
                hintText: '请输入频道名称',
              ),
            ),
            SizedBox(height: 16.h),
            TextField(
              controller: descriptionController,
              decoration: const InputDecoration(
                labelText: '频道描述（选填）',
                hintText: '请输入频道描述',
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () {
              if (nameController.text.isNotEmpty) {
                context.read<ChannelBloc>().add(
                      CreateChannel(
                        name: nameController.text,
                        description: descriptionController.text.isEmpty
                            ? null
                            : descriptionController.text,
                        isVoiceChannel: isVoiceChannel,
                      ),
                    );
                Navigator.of(context).pop();
              }
            },
            child: const Text('创建'),
          ),
        ],
      ),
    );
  }

  Future<void> _showChannelInfoDialog(Channel channel) async {
    final onlineUsers = channel.users.where((user) => user.isOnline).toList();
    final offlineUsers = channel.users.where((user) => !user.isOnline).toList();

    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(channel.name),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (channel.description != null) ...[
                const Text(
                  '频道描述',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(channel.description!),
                const Divider(),
              ],
              Text(
                '在线用户 (${onlineUsers.length})',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 8.h),
              if (onlineUsers.isEmpty)
                const Text('暂无用户在线')
              else
                ...onlineUsers.map(
                  (user) => ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.green,
                      child: Text(
                        user.username[0].toUpperCase(),
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                    title: Text(user.username),
                    dense: true,
                  ),
                ),
              const Divider(),
              Text(
                '离线用户 (${offlineUsers.length})',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 8.h),
              ...offlineUsers.map(
                (user) => ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Colors.grey,
                    child: Text(
                      user.username[0].toUpperCase(),
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                  title: Text(user.username),
                  dense: true,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }
} 