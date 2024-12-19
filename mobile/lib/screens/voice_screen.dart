import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../blocs/voice/voice_bloc.dart';
import '../models/user.dart';

class VoiceScreen extends StatelessWidget {
  final String channelId;
  final String channelName;

  const VoiceScreen({
    super.key,
    required this.channelId,
    required this.channelName,
  });

  @override
  Widget build(BuildContext context) {
    return BlocListener<VoiceBloc, VoiceState>(
      listener: (context, state) {
        if (state is VoiceFailure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(channelName),
          actions: [
            BlocBuilder<VoiceBloc, VoiceState>(
              builder: (context, state) {
                if (state is VoiceConnected) {
                  return Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          state.isMuted ? Icons.mic_off : Icons.mic,
                          color: state.isMuted
                              ? Theme.of(context).colorScheme.error
                              : null,
                        ),
                        onPressed: () {
                          context.read<VoiceBloc>().add(ToggleMute());
                        },
                      ),
                      IconButton(
                        icon: Icon(
                          state.isDeafened
                              ? Icons.volume_off
                              : Icons.volume_up,
                          color: state.isDeafened
                              ? Theme.of(context).colorScheme.error
                              : null,
                        ),
                        onPressed: () {
                          context.read<VoiceBloc>().add(ToggleDeafen());
                        },
                      ),
                    ],
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ],
        ),
        body: BlocBuilder<VoiceBloc, VoiceState>(
          builder: (context, state) {
            if (state is VoiceConnecting) {
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('正在连接语音频道...'),
                  ],
                ),
              );
            }

            if (state is VoiceConnected) {
              return Column(
                children: [
                  _buildLocalPreview(state.localStream),
                  const Divider(),
                  Expanded(
                    child: _buildSpeakerList(
                      state.speakers,
                      state.remoteStreams,
                    ),
                  ),
                ],
              );
            }

            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('未连接到语音频道'),
                  SizedBox(height: 16.h),
                  FilledButton(
                    onPressed: () {
                      context.read<VoiceBloc>().add(JoinVoiceChannel(channelId));
                    },
                    child: const Text('加入语音频��'),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildLocalPreview(MediaStream? localStream) {
    return Container(
      padding: EdgeInsets.all(16.w),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24.r,
            child: const Icon(Icons.person),
          ),
          SizedBox(width: 16.w),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '你',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text('正在说话...'),
              ],
            ),
          ),
          if (localStream != null)
            RTCVideoView(
              RTCVideoRenderer()..srcObject = localStream,
              objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
            ),
        ],
      ),
    );
  }

  Widget _buildSpeakerList(
    List<User> speakers,
    Map<String, MediaStream> remoteStreams,
  ) {
    if (speakers.isEmpty) {
      return const Center(
        child: Text('频道内暂无其他用户'),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(16.w),
      itemCount: speakers.length,
      itemBuilder: (context, index) {
        final speaker = speakers[index];
        final stream = remoteStreams[speaker.id];

        return ListTile(
          leading: CircleAvatar(
            backgroundColor: speaker.isOnline ? Colors.green : Colors.grey,
            child: Text(
              speaker.username[0].toUpperCase(),
              style: const TextStyle(color: Colors.white),
            ),
          ),
          title: Text(speaker.username),
          subtitle: Text(speaker.isOnline ? '正在说话...' : '离线'),
          trailing: stream != null
              ? RTCVideoView(
                  RTCVideoRenderer()..srcObject = stream,
                  objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                )
              : null,
        );
      },
    );
  }
} 