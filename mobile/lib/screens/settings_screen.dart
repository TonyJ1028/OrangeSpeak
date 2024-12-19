import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(16.w),
      child: Column(
        children: [
          _buildUserInfo(),
          SizedBox(height: 20.h),
          _buildSettingsList(context),
        ],
      ),
    );
  }

  Widget _buildUserInfo() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16.w),
        child: Row(
          children: [
            CircleAvatar(
              radius: 30.r,
              child: const Icon(Icons.person),
            ),
            SizedBox(width: 16.w),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '用户名',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
                SizedBox(height: 4.h),
                const Text(
                  '在线',
                  style: TextStyle(
                    color: Colors.green,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsList(BuildContext context) {
    return Expanded(
      child: ListView(
        children: [
          _buildSettingsSection(
            '音频设置',
            [
              ListTile(
                leading: const Icon(Icons.mic),
                title: const Text('麦克风'),
                trailing: Switch(
                  value: true,
                  onChanged: (value) {
                    // TODO: 实现麦克风开关功能
                  },
                ),
              ),
              ListTile(
                leading: const Icon(Icons.volume_up),
                title: const Text('扬声器'),
                trailing: Switch(
                  value: true,
                  onChanged: (value) {
                    // TODO: 实现扬声器开关功能
                  },
                ),
              ),
            ],
          ),
          _buildSettingsSection(
            '通知设置',
            [
              ListTile(
                leading: const Icon(Icons.notifications),
                title: const Text('消息通知'),
                trailing: Switch(
                  value: true,
                  onChanged: (value) {
                    // TODO: 实现通知开关功能
                  },
                ),
              ),
            ],
          ),
          _buildSettingsSection(
            '其他设置',
            [
              ListTile(
                leading: const Icon(Icons.color_lens),
                title: const Text('主题设置'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // TODO: 打开主题设置页面
                },
              ),
              ListTile(
                leading: const Icon(Icons.info_outline),
                title: const Text('关于'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {
                  // TODO: 打开关于页面
                },
              ),
              ListTile(
                leading: const Icon(Icons.logout),
                title: const Text('退出登录'),
                onTap: () {
                  // TODO: 实现退出登录功能
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.symmetric(vertical: 8.h, horizontal: 16.w),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 16.sp,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
        ),
        Card(
          child: Column(
            children: children,
          ),
        ),
        SizedBox(height: 16.h),
      ],
    );
  }
} 