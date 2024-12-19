import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'blocs/auth/auth_bloc.dart';
import 'blocs/channel/channel_bloc.dart';
import 'blocs/voice/voice_bloc.dart';
import 'blocs/chat/chat_bloc.dart';
import 'services/api_service.dart';
import 'services/webrtc_service.dart';
import 'services/chat_service.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final apiService = await ApiService.create();
  final webRTCService = WebRTCService();
  final chatService = ChatService();
  runApp(MyApp(
    apiService: apiService,
    webRTCService: webRTCService,
    chatService: chatService,
  ));
}

class MyApp extends StatelessWidget {
  final ApiService apiService;
  final WebRTCService webRTCService;
  final ChatService chatService;
  
  MyApp({
    super.key,
    required this.apiService,
    required this.webRTCService,
    required this.chatService,
  }) {
    _router = GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => BlocBuilder<AuthBloc, AuthState>(
            builder: (context, state) {
              if (state is AuthAuthenticated) {
                return const HomeScreen();
              }
              return const LoginScreen();
            },
          ),
        ),
        GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: '/home',
          builder: (context, state) => const HomeScreen(),
        ),
      ],
      redirect: (context, state) {
        final isAuthenticated = context.read<AuthBloc>().state is AuthAuthenticated;
        final isLoginRoute = state.matchedLocation == '/';
        final isRegisterRoute = state.matchedLocation == '/register';

        if (!isAuthenticated && !isLoginRoute && !isRegisterRoute) {
          return '/';
        }
        if (isAuthenticated && (isLoginRoute || isRegisterRoute)) {
          return '/home';
        }
        return null;
      },
    );
  }

  late final GoRouter _router;

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider.value(
          value: apiService,
        ),
        RepositoryProvider.value(
          value: webRTCService,
        ),
        RepositoryProvider.value(
          value: chatService,
        ),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider(
            create: (context) => AuthBloc(
              context.read<ApiService>(),
            )..add(AppStarted()),
          ),
          BlocProvider(
            create: (context) => ChannelBloc(
              context.read<ApiService>(),
            ),
          ),
          BlocProvider(
            create: (context) => VoiceBloc(
              context.read<WebRTCService>(),
              context.read<ApiService>(),
            ),
          ),
          BlocProvider(
            create: (context) => ChatBloc(
              chatService: context.read<ChatService>(),
              apiService: context.read<ApiService>(),
            ),
          ),
        ],
        child: ScreenUtilInit(
          designSize: const Size(375, 812),
          minTextAdapt: true,
          splitScreenMode: true,
          builder: (context, child) {
            return MaterialApp.router(
              title: 'OrangeMessage',
              theme: ThemeData(
                colorScheme: ColorScheme.fromSeed(
                  seedColor: Colors.orange,
                  brightness: Brightness.light,
                ),
                useMaterial3: true,
              ),
              darkTheme: ThemeData(
                colorScheme: ColorScheme.fromSeed(
                  seedColor: Colors.orange,
                  brightness: Brightness.dark,
                ),
                useMaterial3: true,
              ),
              routerConfig: _router,
            );
          },
        ),
      ),
    );
  }
}
