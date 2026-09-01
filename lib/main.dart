import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

final InAppLocalhostServer localhostServer = InAppLocalhostServer(documentRoot: 'easyfmm-dev');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await localhostServer.start();
  runApp(const MaterialApp(
    debugShowCheckedModeBanner: false,
    home: EasyFmmWebView(),
  ));
}

class EasyFmmWebView extends StatefulWidget {
  const EasyFmmWebView({super.key});

  @override
  State<EasyFmmWebView> createState() => _EasyFmmWebViewState();
}

class _EasyFmmWebViewState extends State<EasyFmmWebView> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: InAppWebView(     
          initialUrlRequest: URLRequest(
            url: WebUri('http://localhost:8080/index.html'),
          ),
          initialSettings: InAppWebViewSettings(
            javaScriptEnabled: true,
            allowFileAccessFromFileURLs: true,
            allowUniversalAccessFromFileURLs: true,
            // 💡 외부 HTTPS(Vercel API) 통신 차단 해제 설정 추가
            mixedContentMode: MixedContentMode.MIXED_CONTENT_ALWAYS_ALLOW,
            useOnDownloadStart: true, // 추가: 다운로드 인터셉트 활성화
          ),
          onWebViewCreated: (controller) {
            // Blob 다운로드 지원을 위한 추가 핸들러
            controller.addJavaScriptHandler(
              handlerName: 'blobData',
              callback: (args) async {
                final String base64String = args[0];
                final String fileName = args[1];

                try {
                  final String base64Data = base64String.split(',').last;
                  final List<int> bytes = base64Decode(base64Data);

                  final directory = await getTemporaryDirectory();
                  final file = File('${directory.path}/$fileName');
                  await file.writeAsBytes(bytes);

                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('파일 공유창을 여는 중: $fileName')),
                    );
                    final box = context.findRenderObject() as RenderBox?;
                    final Rect? sharePositionOrigin = box != null ? box.localToGlobal(Offset.zero) & box.size : null;
                    await Share.shareXFiles(
                      [XFile(file.path, mimeType: 'application/json', name: fileName)],
                      text: 'EasyFMM Save File',
                      sharePositionOrigin: sharePositionOrigin,
                    );
                  }
                } catch (e) {
                  print("Error saving blob file: $e");
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('저장 중 오류가 발생했습니다: $e')),
                    );
                  }
                }
              },
            );

            controller.addJavaScriptHandler(
              handlerName: 'saveFile',
              callback: (args) async {
                final String jsonString = args[0];
                final String fileName = args[1];

                try {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('파일 저장/공유를 준비 중입니다...')),
                    );
                  }
                  final directory = await getTemporaryDirectory();
                  final file = File('${directory.path}/$fileName');
                  await file.writeAsString(jsonString);

                  if (context.mounted) {
                    final box = context.findRenderObject() as RenderBox?;
                    final Rect? sharePositionOrigin = box != null ? box.localToGlobal(Offset.zero) & box.size : null;
                    await Share.shareXFiles(
                      [XFile(file.path, mimeType: 'application/json', name: fileName)],
                      text: 'EasyFMM Save File',
                      sharePositionOrigin: sharePositionOrigin,
                    );
                  }
                } catch (e) {
                  print("Error saving file: $e");
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('저장 실패: $e')),
                    );
                  }
                }
              },
            );
          },
          // Blob 등 브라우저 기본 다운로드 동작을 가로챔
          onDownloadStartRequest: (controller, downloadStartRequest) async {
            final String url = downloadStartRequest.url.toString();
            final String suggestedFilename = downloadStartRequest.suggestedFilename ?? 'save.json';
            
            if (url.startsWith('blob:')) {
              // JS를 주입하여 Blob을 Base64로 변환 후 dart 측 핸들러(blobData)로 전달
              String jsCode = '''
                var xhr = new XMLHttpRequest();
                xhr.open('GET', '$url', true);
                xhr.responseType = 'blob';
                xhr.onload = function(e) {
                  if (this.status == 200) {
                    var blob = this.response;
                    var reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = function() {
                      var base64data = reader.result;
                      window.flutter_inappwebview.callHandler('blobData', base64data, '$suggestedFilename');
                    }
                  }
                };
                xhr.send();
              ''';
              await controller.evaluateJavascript(source: jsCode);
            }
          },
          // 💡 웹 내부 JS 에러/로그를 플러터 터미널에 출력하는 설정
          onConsoleMessage: (controller, consoleMessage) {
            print("WebView Console: ${consoleMessage.message}");
          },
        ),
      ),
    );
  }
}