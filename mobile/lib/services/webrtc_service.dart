import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';

class WebRTCService {
  static const String wsUrl = 'ws://localhost:3000/rtc';
  
  WebSocketChannel? _channel;
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  final Map<String, MediaStream> _remoteStreams = {};
  
  Function(MediaStream)? onLocalStream;
  Function(String, MediaStream)? onRemoteStream;
  Function(String)? onUserJoined;
  Function(String)? onUserLeft;
  Function(dynamic)? onError;

  Future<void> initialize() async {
    final configuration = {
      'iceServers': [
        {
          'urls': [
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
          ],
        },
      ],
    };

    _peerConnection = await createPeerConnection(configuration);

    _peerConnection!.onIceCandidate = (candidate) {
      _sendMessage({
        'type': 'candidate',
        'candidate': candidate.toMap(),
      });
    };

    _peerConnection!.onTrack = (event) {
      if (event.streams.isNotEmpty) {
        final stream = event.streams[0];
        final trackId = event.track.id ?? 'unknown';
        _remoteStreams[trackId] = stream;
        onRemoteStream?.call(trackId, stream);
      }
    };
  }

  Future<void> joinChannel(String channelId, String token) async {
    try {
      final uri = Uri.parse('$wsUrl/$channelId');
      _channel = WebSocketChannel.connect(uri, protocols: [token]);
      
      _channel!.stream.listen(
        (message) => _handleMessage(jsonDecode(message)),
        onError: (error) => onError?.call(error),
        onDone: () => _cleanup(),
      );

      await _initializeLocalStream();
      await _addLocalStreamToPeerConnection();
      
      _sendMessage({
        'type': 'join',
        'channelId': channelId,
      });
    } catch (e) {
      onError?.call(e);
    }
  }

  Future<void> leaveChannel() async {
    await _cleanup();
  }

  Future<void> toggleMute() async {
    if (_localStream != null) {
      final audioTrack = _localStream!.getAudioTracks().first;
      audioTrack.enabled = !audioTrack.enabled;
    }
  }

  Future<void> toggleDeafen() async {
    for (final stream in _remoteStreams.values) {
      final audioTrack = stream.getAudioTracks().first;
      audioTrack.enabled = !audioTrack.enabled;
    }
  }

  Future<void> _initializeLocalStream() async {
    final constraints = {
      'audio': true,
      'video': false,
    };

    try {
      _localStream = await navigator.mediaDevices.getUserMedia(constraints);
      onLocalStream?.call(_localStream!);
    } catch (e) {
      onError?.call('获取麦克风权限失败: $e');
    }
  }

  Future<void> _addLocalStreamToPeerConnection() async {
    if (_localStream != null && _peerConnection != null) {
      for (final track in _localStream!.getTracks()) {
        await _peerConnection!.addTrack(track, _localStream!);
      }
    }
  }

  Future<void> _createAndSendOffer() async {
    try {
      final offer = await _peerConnection!.createOffer();
      await _peerConnection!.setLocalDescription(offer);
      
      _sendMessage({
        'type': 'offer',
        'sdp': offer.sdp,
      });
    } catch (e) {
      onError?.call('创建offer失败: $e');
    }
  }

  Future<void> _handleAnswer(Map<String, dynamic> message) async {
    try {
      final answer = RTCSessionDescription(
        message['sdp'],
        'answer',
      );
      await _peerConnection!.setRemoteDescription(answer);
    } catch (e) {
      onError?.call('处理answer失败: $e');
    }
  }

  Future<void> _handleOffer(Map<String, dynamic> message) async {
    try {
      final offer = RTCSessionDescription(
        message['sdp'],
        'offer',
      );
      await _peerConnection!.setRemoteDescription(offer);
      
      final answer = await _peerConnection!.createAnswer();
      await _peerConnection!.setLocalDescription(answer);
      
      _sendMessage({
        'type': 'answer',
        'sdp': answer.sdp,
      });
    } catch (e) {
      onError?.call('处理offer失败: $e');
    }
  }

  Future<void> _handleCandidate(Map<String, dynamic> message) async {
    try {
      final candidate = RTCIceCandidate(
        message['candidate']['candidate'],
        message['candidate']['sdpMid'],
        message['candidate']['sdpMLineIndex'],
      );
      await _peerConnection!.addCandidate(candidate);
    } catch (e) {
      onError?.call('处理candidate失败: $e');
    }
  }

  void _handleMessage(Map<String, dynamic> message) {
    switch (message['type']) {
      case 'offer':
        _handleOffer(message);
        break;
      case 'answer':
        _handleAnswer(message);
        break;
      case 'candidate':
        _handleCandidate(message);
        break;
      case 'user-joined':
        onUserJoined?.call(message['userId']);
        _createAndSendOffer();
        break;
      case 'user-left':
        onUserLeft?.call(message['userId']);
        break;
      case 'error':
        onError?.call(message['message']);
        break;
    }
  }

  void _sendMessage(Map<String, dynamic> message) {
    if (_channel != null) {
      _channel!.sink.add(jsonEncode(message));
    }
  }

  Future<void> _cleanup() async {
    _channel?.sink.close();
    _channel = null;

    for (final stream in _remoteStreams.values) {
      for (final track in stream.getTracks()) {
        track.stop();
      }
    }
    _remoteStreams.clear();

    if (_localStream != null) {
      for (final track in _localStream!.getTracks()) {
        track.stop();
      }
      _localStream = null;
    }

    await _peerConnection?.close();
    _peerConnection = null;
  }

  void dispose() {
    _cleanup();
  }
} 