import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../../models/voice_state.dart';
import '../../models/user.dart';
import '../../services/webrtc_service.dart';
import '../../services/api_service.dart';

// Events
abstract class VoiceEvent extends Equatable {
  const VoiceEvent();

  @override
  List<Object?> get props => [];
}

class JoinVoiceChannel extends VoiceEvent {
  final String channelId;

  const JoinVoiceChannel(this.channelId);

  @override
  List<Object> get props => [channelId];
}

class LeaveVoiceChannel extends VoiceEvent {}

class ToggleMute extends VoiceEvent {}

class ToggleDeafen extends VoiceEvent {}

class UpdateSpeakers extends VoiceEvent {
  final List<User> speakers;

  const UpdateSpeakers(this.speakers);

  @override
  List<Object> get props => [speakers];
}

class UpdateLocalStream extends VoiceEvent {
  final MediaStream stream;

  const UpdateLocalStream(this.stream);

  @override
  List<Object> get props => [stream];
}

class UpdateRemoteStream extends VoiceEvent {
  final String userId;
  final MediaStream stream;

  const UpdateRemoteStream(this.userId, this.stream);

  @override
  List<Object> get props => [userId, stream];
}

class VoiceError extends VoiceEvent {
  final String message;

  const VoiceError(this.message);

  @override
  List<Object> get props => [message];
}

// States
abstract class VoiceState extends Equatable {
  const VoiceState();

  @override
  List<Object?> get props => [];
}

class VoiceInitial extends VoiceState {}

class VoiceConnecting extends VoiceState {}

class VoiceConnected extends VoiceState {
  final String channelId;
  final List<User> speakers;
  final bool isMuted;
  final bool isDeafened;
  final MediaStream? localStream;
  final Map<String, MediaStream> remoteStreams;

  const VoiceConnected({
    required this.channelId,
    required this.speakers,
    this.isMuted = false,
    this.isDeafened = false,
    this.localStream,
    this.remoteStreams = const {},
  });

  VoiceConnected copyWith({
    String? channelId,
    List<User>? speakers,
    bool? isMuted,
    bool? isDeafened,
    MediaStream? localStream,
    Map<String, MediaStream>? remoteStreams,
  }) {
    return VoiceConnected(
      channelId: channelId ?? this.channelId,
      speakers: speakers ?? this.speakers,
      isMuted: isMuted ?? this.isMuted,
      isDeafened: isDeafened ?? this.isDeafened,
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
        localStream,
        remoteStreams,
      ];
}

class VoiceDisconnected extends VoiceState {}

class VoiceFailure extends VoiceState {
  final String message;

  const VoiceFailure(this.message);

  @override
  List<Object> get props => [message];
}

// Bloc
class VoiceBloc extends Bloc<VoiceEvent, VoiceState> {
  final WebRTCService _webRTCService;
  final ApiService _apiService;

  VoiceBloc(this._webRTCService, this._apiService) : super(VoiceInitial()) {
    on<JoinVoiceChannel>(_onJoinVoiceChannel);
    on<LeaveVoiceChannel>(_onLeaveVoiceChannel);
    on<ToggleMute>(_onToggleMute);
    on<ToggleDeafen>(_onToggleDeafen);
    on<UpdateSpeakers>(_onUpdateSpeakers);
    on<UpdateLocalStream>(_onUpdateLocalStream);
    on<UpdateRemoteStream>(_onUpdateRemoteStream);
    on<VoiceError>(_onVoiceError);

    _setupWebRTCCallbacks();
  }

  void _setupWebRTCCallbacks() {
    _webRTCService.onLocalStream = (stream) {
      add(UpdateLocalStream(stream));
    };

    _webRTCService.onRemoteStream = (userId, stream) {
      add(UpdateRemoteStream(userId, stream));
    };

    _webRTCService.onUserJoined = (userId) async {
      try {
        final speakers = await _apiService.getChannelUsers(
          (state as VoiceConnected).channelId,
        );
        add(UpdateSpeakers(speakers));
      } catch (e) {
        add(VoiceError(e.toString()));
      }
    };

    _webRTCService.onUserLeft = (userId) async {
      try {
        final speakers = await _apiService.getChannelUsers(
          (state as VoiceConnected).channelId,
        );
        add(UpdateSpeakers(speakers));
      } catch (e) {
        add(VoiceError(e.toString()));
      }
    };

    _webRTCService.onError = (error) {
      add(VoiceError(error.toString()));
    };
  }

  Future<void> _onJoinVoiceChannel(
    JoinVoiceChannel event,
    Emitter<VoiceState> emit,
  ) async {
    try {
      emit(VoiceConnecting());

      await _webRTCService.initialize();
      final token = await _apiService.getVoiceToken();
      await _webRTCService.joinChannel(event.channelId, token);

      final speakers = await _apiService.getChannelUsers(event.channelId);
      
      emit(VoiceConnected(
        channelId: event.channelId,
        speakers: speakers,
      ));
    } catch (e) {
      emit(VoiceFailure(e.toString()));
    }
  }

  Future<void> _onLeaveVoiceChannel(
    LeaveVoiceChannel event,
    Emitter<VoiceState> emit,
  ) async {
    await _webRTCService.leaveChannel();
    emit(VoiceDisconnected());
  }

  Future<void> _onToggleMute(
    ToggleMute event,
    Emitter<VoiceState> emit,
  ) async {
    if (state is VoiceConnected) {
      final currentState = state as VoiceConnected;
      await _webRTCService.toggleMute();
      emit(currentState.copyWith(isMuted: !currentState.isMuted));
    }
  }

  Future<void> _onToggleDeafen(
    ToggleDeafen event,
    Emitter<VoiceState> emit,
  ) async {
    if (state is VoiceConnected) {
      final currentState = state as VoiceConnected;
      await _webRTCService.toggleDeafen();
      emit(currentState.copyWith(isDeafened: !currentState.isDeafened));
    }
  }

  void _onUpdateSpeakers(
    UpdateSpeakers event,
    Emitter<VoiceState> emit,
  ) {
    if (state is VoiceConnected) {
      final currentState = state as VoiceConnected;
      emit(currentState.copyWith(speakers: event.speakers));
    }
  }

  void _onUpdateLocalStream(
    UpdateLocalStream event,
    Emitter<VoiceState> emit,
  ) {
    if (state is VoiceConnected) {
      final currentState = state as VoiceConnected;
      emit(currentState.copyWith(localStream: event.stream));
    }
  }

  void _onUpdateRemoteStream(
    UpdateRemoteStream event,
    Emitter<VoiceState> emit,
  ) {
    if (state is VoiceConnected) {
      final currentState = state as VoiceConnected;
      final newRemoteStreams = Map<String, MediaStream>.from(currentState.remoteStreams);
      newRemoteStreams[event.userId] = event.stream;
      emit(currentState.copyWith(remoteStreams: newRemoteStreams));
    }
  }

  void _onVoiceError(
    VoiceError event,
    Emitter<VoiceState> emit,
  ) {
    emit(VoiceFailure(event.message));
  }

  @override
  Future<void> close() {
    _webRTCService.dispose();
    return super.close();
  }
} 