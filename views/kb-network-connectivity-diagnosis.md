{% import "views/_helper.njk" as docs %}
# 网络连通性诊断流程

本文适用于使用了 LeanCloud SDK 而出现的小范围、无法确认的网络连通性的诊断。以下内容以 macOS 为例，其他操作系统和工具的安装方法见文末 [安装诊断工具](#安装诊断工具)。

建议先确定域名，然后进行「快速诊断」，根据结果再进行其他诊断。如果诊断的目标是 4G 网络，建议在手机上打开无线热点，然后使用 macOS 接入热点进行诊断。如果问题发生在用户的设备上，可能需要用户的配合来完成诊断。

### 确定域名

LeanCloud 不同版本的 SDK 可能使用不同的域名，因此需要先确定所使用的域名以便进行后续的诊断。

使用 JS SDK，可以打开浏览器的调试工具查看网络请求；在 Android 或 iOS 上，可以打开调试日志查看网络请求。如果是用户反馈上来的问题，你可以用同版本的应用进行上述步骤确定所使用的域名。以下以 `api.leancloud.cn` 为例，请替换为你所使用的域名，如果是云引擎的请求，请使用云引擎域名。

### 快速诊断

```
curl -I -w 'nslookup: %{time_namelookup}, connect: %{time_connect}, init_ssl: %{time_appconnect}, starttransfer: %{time_starttransfer}, total_time: %{time_total}, http_code: %{http_code}, remote_ip: %{remote_ip}, local_ip: %{local_ip}' https://api.leancloud.cn/1.1/date
```

上述命令会给出通过 HTTP 访问 LeanCloud 服务的耗时情况，一般总耗时 1 秒以下是可以接受的：

```
nslookup: 0.005, connect: 0.032, init_ssl: 0.065, starttransfer: 0.074, total_time: 0.074, http_code: 404, remote_ip: 106.75.66.151, local_ip: 192.168.81.50
```

注意输出中的时间都是「时刻」而不是「耗时」，例如 init_ssl 的耗时实际上是 0.065 - 0.032 = 0.033s.

- **nslookup** 表示 DNS 查询耗时，若耗时过长请跳到「[DNS 诊断](#DNS_诊断)」
- **connect**、**init_ssl** 表示 TCP 和 SSL 连接初始化的耗时，若耗时较长说明延迟或丢包较高，请跳转到「[延迟和丢包诊断](#延迟和丢包诊断)」
- **starttransfer** 表示等待服务器响应的第一个字节的耗时，相当于服务器处理请求的时间，但也会受到延迟和丢包的影响
- **total_time** 表示内容传输的耗时，一定程度上取决于被请求的内容，也会受到延迟和丢包的影响
- **http_code** 表示收到的 HTTP 响应代码，一般只要收到了响应就表示连通性没有问题，如果未收到响应说明无法连接到 LeanCloud。
- **remote_ip** 表示本次请求所连接到的服务器地址。

如果请求未成功完成（http_code 显示为 000）：

- 如果输出中有打印 `curl: (6) Could not resolve host`，请跳转到「[DNS 诊断](#DNS_诊断)」。
- 如果输出中有打印 `curl: (7) Failed to connect to host`，请先进行「[DNS 诊断](#DNS_诊断)」，再进行「[延迟和丢包诊断](#延迟和丢包诊断)」。
- 如果输出中有打印 `curl: (35) SSL connect error`，请先进行「[DNS 诊断](#DNS_诊断)」，再进行「[SSL 诊断](#SSL_诊断)」。
- 如果输出中有打印 `curl: (60) SSL certificate problem`，请先进行「[DNS 诊断](#DNS_诊断)」，再进行「[SSL 诊断](#SSL_诊断)」。

如果命令长时间没有结束，请改用 `curl -v https://api.leancloud.cn/1.1/date` 来获取不完整的信息，确认请求卡在哪个步骤，再进行「[延迟和丢包诊断](#延迟和丢包诊断)」。

请留意在进行诊断时是否开启了代理，否则得到的是经过了代理的访问情况，如不确认请在 curl 后添加 `--noproxy '*'`。

有些开发者可能习惯用 ping 检测服务可用性，但是 LeanCloud 的服务器并不是全部支持 ping 检测，所以 ping 的结果无法反映服务可用性。
我们建议使用 curl 等工具检测（参见本小节开头的 curl 测试命令样例）。

### DNS 诊断

```
dig api.leancloud.cn
```

上述命令会给出 DNS 查询的结果，以下是部分输出：

```
// ...

;; QUESTION SECTION:
;api.leancloud.cn.      IN  A

;; ANSWER SECTION:
api.leancloud.cn.   286 IN  CNAME   api-ucloud.leancloud.cn.
api-ucloud.leancloud.cn. 353    IN  A   106.75.87.92
api-ucloud.leancloud.cn. 353    IN  A   106.75.95.143
api-ucloud.leancloud.cn. 353    IN  A   106.75.66.151
api-ucloud.leancloud.cn. 353    IN  A   106.75.87.91
api-ucloud.leancloud.cn. 353    IN  A   106.75.95.141
api-ucloud.leancloud.cn. 353    IN  A   120.132.49.239
api-ucloud.leancloud.cn. 353    IN  A   123.59.41.31
api-ucloud.leancloud.cn. 353    IN  A   106.75.95.142

// ...

;; Query time: 27 msec
;; SERVER: 192.168.89.3#53(192.168.89.3)
;; WHEN: Wed Jun  7 15:56:35 2017
;; MSG SIZE  rcvd: 456
```

你需要在被诊断的设备和正常的设备下分别运行该命令，然后对比两者的结果（`ANSWER SECTION` 部分），如果结果不同说明发生了 DNS 劫持。如果域名无法解析可能是你没有连接到互联网，或者 DNS Server（上面 `SERVER: 192.168.89.3` 的部分）存在故障。

如果域名无法解析或确实存在 DNS 劫持，可以尝试将设备上的 DNS Server 配置成更可靠的服务商（例如 DNSPod 119.29.29.29、阿里 DNS 223.5.5.5）。若更换后仍无法解析出正确的结果，需要向你的运营商（电信、联通等）投诉。

如果你的设备全部存在连通性问题，可以尝试使用第三方服务的解析结果进行对比（例如 [digwebinterface.com](https://www.digwebinterface.com/?hostnames=api.leancloud.cn&type=&ns=resolver&useresolver=8.8.4.4)）。

Windows 系统下没有预装 `dig` 命令，可以使用 nslookup：

```
nslookup -debug api.leancloud.cn 
```

### SSL 诊断

SSL 本身有防御 DNS 劫持的能力，因此在进行 SSL 诊断之前请先检查 DNS 劫持的情况，如果 DNS 确实被劫持了，可通过下面的命令看到劫持者所使用的证书。

```
openssl s_client -connect api.leancloud.cn:443 -servername api.leancloud.cn
```

以下是部分结果，可以看到对方使用的证书：

```
Certificate chain
 0 s:/C=CN/ST=Beijing/L=Beijing/O=Mei Wei Shu Qian ( Beijing ) IT Co., Ltd./OU=OPS/CN=*.leancloud.cn
   i:/C=US/O=GeoTrust Inc./CN=GeoTrust SSL CA - G3
 1 s:/C=US/O=GeoTrust Inc./CN=GeoTrust SSL CA - G3
   i:/C=US/O=GeoTrust Inc./CN=GeoTrust Global CA
```

完整结果还包含了更多的信息，如果确实发生了劫持可将结果提供给我们。

### 安装诊断工具

- macOS 自带 ping 和 curl，mtr 和 openssl 需要 `brew install mtr openssl`，brew 需要在 <https://brew.sh/> 安装。
- Windows & Linux 使用 mtr：[使用 MTR 诊断网络问题](https://meiriyitie.com/2015/05/26/diagnosing-network-issues-with-mtr)。
- 在 Android 或 iOS 上可以使用 [HE.NET Network Tools](http://networktools.he.net/) 提供的 DNS、Ping 和 Traceroute（类似 mtr）。

----------
相关文档：[中国移动运营商网络问题的诊断和投诉](https://leancloudblog.com/zhong-guo-yi-dong-yun-ying-shang-wang-luo-wen-ti-de-zhen-duan-he-tou-su/)

