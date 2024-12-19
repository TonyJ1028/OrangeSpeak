import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../models/channel.dart';
import '../../services/api_service.dart';

// Events
abstract class ChannelEvent extends Equatable {
  const ChannelEvent();

  @override
  List<Object?> get props => [];
}

class LoadChannels extends ChannelEvent {}

class CreateChannel extends ChannelEvent {
  final String name;
  final String? description;
  final bool isVoiceChannel;

  const CreateChannel({
    required this.name,
    this.description,
    required this.isVoiceChannel,
  });

  @override
  List<Object?> get props => [name, description, isVoiceChannel];
}

class JoinChannel extends ChannelEvent {
  final String channelId;

  const JoinChannel(this.channelId);

  @override
  List<Object> get props => [channelId];
}

class LeaveChannel extends ChannelEvent {
  final String channelId;

  const LeaveChannel(this.channelId);

  @override
  List<Object> get props => [channelId];
}

// States
abstract class ChannelState extends Equatable {
  const ChannelState();

  @override
  List<Object?> get props => [];
}

class ChannelInitial extends ChannelState {}

class ChannelLoading extends ChannelState {}

class ChannelLoaded extends ChannelState {
  final List<Channel> channels;

  const ChannelLoaded(this.channels);

  @override
  List<Object> get props => [channels];
}

class ChannelError extends ChannelState {
  final String message;

  const ChannelError(this.message);

  @override
  List<Object> get props => [message];
}

// Bloc
class ChannelBloc extends Bloc<ChannelEvent, ChannelState> {
  final ApiService _apiService;

  ChannelBloc(this._apiService) : super(ChannelInitial()) {
    on<LoadChannels>(_onLoadChannels);
    on<CreateChannel>(_onCreateChannel);
    on<JoinChannel>(_onJoinChannel);
    on<LeaveChannel>(_onLeaveChannel);
  }

  Future<void> _onLoadChannels(
    LoadChannels event,
    Emitter<ChannelState> emit,
  ) async {
    emit(ChannelLoading());
    try {
      final channels = await _apiService.getChannels();
      emit(ChannelLoaded(channels));
    } catch (e) {
      emit(ChannelError(e.toString()));
    }
  }

  Future<void> _onCreateChannel(
    CreateChannel event,
    Emitter<ChannelState> emit,
  ) async {
    emit(ChannelLoading());
    try {
      await _apiService.createChannel(
        name: event.name,
        description: event.description,
        isVoiceChannel: event.isVoiceChannel,
      );
      final channels = await _apiService.getChannels();
      emit(ChannelLoaded(channels));
    } catch (e) {
      emit(ChannelError(e.toString()));
    }
  }

  Future<void> _onJoinChannel(
    JoinChannel event,
    Emitter<ChannelState> emit,
  ) async {
    try {
      await _apiService.joinChannel(event.channelId);
      final channels = await _apiService.getChannels();
      emit(ChannelLoaded(channels));
    } catch (e) {
      emit(ChannelError(e.toString()));
    }
  }

  Future<void> _onLeaveChannel(
    LeaveChannel event,
    Emitter<ChannelState> emit,
  ) async {
    try {
      await _apiService.leaveChannel(event.channelId);
      final channels = await _apiService.getChannels();
      emit(ChannelLoaded(channels));
    } catch (e) {
      emit(ChannelError(e.toString()));
    }
  }
} 