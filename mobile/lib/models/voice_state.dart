import 'package:equatable/equatable.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'user.dart';

class VoiceState extends Equatable {
  final String channelId;
  final List<User> speakers;
  final bool isMuted;
  final bool isDeafened;
  final RTCPeerConnection? peerConnection;
  final MediaStream? localStream;
  final Map<String, MediaStream> remoteStreams;

  const VoiceState({
    required this.channelId,
    required this.speakers,
    this.isMuted = false,
    this.isDeafened = false,
    this.peerConnection,
    this.localStream,
    this.remoteStreams = const {},
  });

  VoiceState copyWith({
    String? channelId,
    List<User>? speakers,
    bool? isMuted,
    bool? isDeafened,
    RTCPeerConnection? peerConnection,
    MediaStream? localStream,
    Map<String, MediaStream>? remoteStreams,
  }) {
    return VoiceState(
      channelId: channelId ?? this.channelId,
      speakers: speakers ?? this.speakers,
      isMuted: isMuted ?? this.isMuted,
      isDeafened: isDeafened ?? this.isDeafened,
      peerConnection: peerConnection ?? this.peerConnection,
      localStream: localStream ?? this.localStream,
      remoteStreams: remoteStreams ?? this.remoteStreams,
    );
  }

  @override
  List<Object?> get props => [
        channelId,
        speakers,
        isMuted,
        isDeafened,
        peerConnection,
        localStream,
        remoteStreams,
      ];
} 