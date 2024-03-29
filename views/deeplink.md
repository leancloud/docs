{% import "views/_helper.njk" as docs %}

# DeepLink 开发指南

LeanCloud 提供了与[全文搜索](app_search_guide.html)搭配使用的 [DeepLink](#deeplink) 功能，让应用可以响应外部调用链接。

这样，当用户在移动端网页搜索关键字之后：

- 如果用户安装了应用，直接打开应用并跳转到正确的页面。
- 如果用户没有安装应用，则显示出应用下载页面，让用户来安装应用。
- 如果用户不愿意安装，那么用户仍然可以直接在网页查看搜索结果的内容。

这是效果图，点击 **打开应用** 即可跳转到具体界面：

![image](images/deeplink_tododemo.png)

## 设置全文搜索选项

为了能够让用户直接在搜索结果中打开相关的应用，开发者需要让自己的应用支持外部调用。我们使用 AppURL 来指向一个可以在应用里展现的 Class 数据，格式如下：

```
{URL Scheme}://{ URL Host }/{ Resource Path }
```
进入 **控制台 > 数据存储 > 全文搜索 > DeepLink 设置**，注意以下几个关键的属性：

- **应用名称**：你的应用名称（必须）
- **应用 URL Scheme**：支持外部调用的 URL scheme，我们强制要求采用**域名反转**的方式，类似 Java 语言的 package 命名机制。假设你的应用的域名为 `myapp.company.com`，那么我们要求的 scheme 就是形如 `com.company.myapp` 的字符串。例如我们的 Todo Demo 设置的 scheme 为 `com.leancloud.todo`。如果你没有域名，那么我们推荐你使用 `com.leancloud.{appId的前8位}` 来作为 Scheme。我们会在保存的时候检测 scheme 是否冲突。
- **应用 URL Host**：支持外部调用的 URL Host，可不设置，但是我们推荐使用默认值 `leancloud`，防止跟其他 AppURL 提供商冲突。

其他一些属性，都是用于设置你的应用的下载地址，例如：

- iPhone 应用下载地址：你的应用的 iPhone 版本的 App Store 下载链接，或者你的网站链接。
- iPad 应用下载地址：你的应用的 iPad 版本的 App Store 下载链接，或者你的网站链接。

这些链接都是可选的，当用户没有安装你的应用的时候，无法直接从搜索结果打开应用，将展示这些下载链接给用户下载你的应用。

设置保存之后，你应该可以通过下列链接访问到你的应用信息：

```
https://{{host}}/1.1/go/{your uri scheme}/
```

查看到你的 App URL 应用设置信息。

例如，我们的 todo 应用就是：

```
https://{{host}}/1.1/go/com.leancloud.todo
```

配置之后，还需要让你的应用响应搜索结果的 URL 调用。
请参见下面 [iOS](#iOS_应用支持外部调用) 和 [Android](#Android_应用支持外部调用) 的说明。

## 数据模板

在为 Class 启用搜索时，可以配置数据模板。
当外部调用无法打开应用（通常是用户没有安装应用）的时候，将渲染这个模板并展现给用户，默认的模板的只是渲染一些下载链接，你可以自定义这个模板的样式，比如加入你的应用 Logo， 添加 CSS 等。

数据模板支持 [handlebars 模板语法](http://handlebarsjs.com/) ，支持的变量（使用两个大括号包起来 {{ docs.mustache("var") }}）包括：

- **app_uri** (String) 打开应用的 URL，就是前面提到的 `{URL Scheme} : // {URL Host} / {Resource Path}`。

- **applinks** (Object) 全文搜索配置对象，包括：
  
  - app_name
  - android_phone_link
  - android_pad_link
  - iphone_link
  - ipad_link

  等等，也就是应用名称，和各种平台应用的下载链接。

- **qrcode_uri** (String) 本页面的二维码图片链接，用户可以用扫描器扫描打开该页面。

- **object** (Object) 查询出来的 object 对象，默认至少包括：`objectId`、`createdAt`、`updatedAt` 三个属性。其他是你在选择开放的列。

以我们的 Todo Demo 为例，我们启用了 Todo 的全文搜索功能，选择了开放字段`content`，设定数据模板（省略了css）为：

<pre><code class="lang-html">&lt;div class=&quot;wrap&quot;&gt;
  &lt;div class=&quot;section section-open&quot;&gt;
    &lt;div class=&quot;section-inner&quot;&gt;
      &lt;p&gt;Todo Content: {{ docs.mustache("object.content") }}&lt;/p&gt;
    &lt;/div&gt;
  &lt;/div&gt;
  &lt;div class=&quot;section section-open&quot;&gt;
    &lt;div class=&quot;section-inner&quot;&gt;
      &lt;p&gt;已安装 {{ docs.mustache("applinks.app_name") }}？你可以:&lt;/p&gt;
      &lt;p&gt;&lt;a href='{{ docs.mustache("app_uri") }}' class=&quot;btn&quot;&gt;直接打开应用&lt;/a&gt;&lt;/p&gt;
    &lt;/div&gt;
  &lt;/div&gt;
  &lt;div class=&quot;section section-download&quot; &gt;
    &lt;div class=&quot;section-inner&quot;&gt;
      &lt;p&gt;或者下载应用:&lt;/p&gt;
      &lt;div &gt;
        &lt;p&gt;&lt;a href='{{ docs.mustache("applinks.iphone_link") }}'&gt;iPhone 应用&lt;/a&gt;&lt;/p&gt;
        &lt;p&gt;&lt;a href='{{ docs.mustache("applinks.ipad_link") }}'&gt;iPad 应用&lt;/a&gt;&lt;/p&gt;
        &lt;p&gt;&lt;a href='{{ docs.mustache("applinks.android_phone_link") }}'&gt;Android 手机应用&lt;/a&gt;&lt;/p&gt;
        &lt;p&gt;&lt;a href='{{ docs.mustache("applinks.android_pad_link") }}'&gt;Android 平板应用&lt;/a&gt;&lt;/p&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;
</code></pre>

在 LeanCloud 索引完成数据后，你应当可以通过下列 URL 访问到一条数据，如果在安装了 Todo Demo 应用的移动设备上访问下面这个URL，应该会打开应用展现这条 Todo 的内容:

```
https://{{host}}/1.1/go/com.leancloud.todo/classes/Todo/5371f3a9e4b02f7aee2c9a18
```

如果直接在 PC 浏览器打开上述链接会看到类似如下的数据渲染页面：

![image](images/todo_render.png)

## iOS 应用支持外部调用

你可以通过编辑应用 [information property list](http://developer.apple.com/library/ios/#documentation/general/Reference/InfoPlistKeyReference/Introduction/Introduction.html)，使得你的应用可以处理 URL Scheme。下图展示了如何为你的应用注册 URL Scheme。

![image](images/ios_register_url_scheme.png)

需要注意的是，你这里的 URL Scheme 应该和你在我们网站上面设置的 URL Scheme 保持一致。

注册完了 URL Scheme，你还需要实现 [application method openURL](http://developer.apple.com/library/ios/#DOCUMENTATION/UIKit/Reference/UIApplication_Class/Reference/Reference.html#jumpTo_37) 。对于 TodoDemo，应该按照如下方法实现。

``` objc
/*
 * 这里的 url.path 应该是 "com.leancloud.todo://leancloud/classes/Todo/5371f3a9e4b02f7aee2c9a18"
 */
(BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation {
    NSString *objectId = [url.path lastPathComponent];

    AVObject *todo = [AVObject objectWithClassName:@"Todo"];
    todo.objectId = objectId;
    [todo fetchInBackgroundWithBlock:^(AVObject *object, NSError *error) {
        // 调用展示数据的方法
        // code is here
    }];
    return YES;
}
```

## Android 应用支持外部调用

在 Android 里，我们可以通过为 Activity 注册 `intent-filter` 来实现。以我们的 Todo Demo 为例，我们想在 `CreateTodo` 这个 Activity 里面展现搜索出来的某一条 Todo 内容，在 `AndroidManifest.xml` 注册 `intent-filter` 配置如下

``` xml
<activity android:name="com.avos.demo.CreateTodo" >
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <!-- 处理以"com.leancloud.todo://leancloud/classes/Todo/"开头的 URI -->
    <data android:scheme="com.leancloud.todo" />
    <data android:host="leancloud" />
    <data android:pathPrefix="/classes/Todo/" />
  </intent-filter>
</activity>
```

- `android:scheme`：设置为你为应用选择的 URL Scheme，这里是 `com.leancloud.todo`
- `android:host`：设置为你为应用选择的 URL Host，默认为 `leancloud`。
- `android:pathPrefix`：具体的资源路径前缀，搜索结果的URL具体路径都将展现为`/classes/{className}/{objectId}`，这里的 className 就是 `Todo`，因此路径前缀为 `classes/Todo/`。
- `action`：必须设置为`android.intent.action.VIEW`，并且加入 `DEFAULT` 和 `BROWSABLE` 的 Category。

接下来在 `CreateTodo` Activity的 `onCreate` 方法里我们接收这个 action 并获取 URL 展现数据：

``` java
Intent intent = getIntent();
// 通过搜索结果打开
if (intent.getAction() == Intent.ACTION_VIEW) {
  // 如果是VIEW action，我们通过getData获取URI
  Uri uri = intent.getData();
  String path = uri.getPath();
  int index = path.lastIndexOf("/");
  if (index > 0) {
  // 获取objectId
  objectId = path.substring(index + 1);
  Todo todo = new Todo();
  todo.setObjectId(objectId);
  // 通过Fetch获取content内容
  todo.fetchInBackground(new GetCallback<AVObject>() {
    @Override
    public void done(AVObject todo, AVException arg1) {
    if (todo != null) {
      String content = todo.getString("content");
      if (content != null) {
      contentText.setText(content);
      }
    }
    }
  });
  }
}
```

开发者可以参考我们的示例代码：[ResultItemActivity.java](https://github.com/leancloud/java-unified-sdk/blob/master/android-sdk/leancloud-search-sample/src/main/java/cn/leancloud/demo/leancloud_search_sample/ResultItemActivity.java)。

我们通过 `adb` 的 `am` 命令来测试配置是否有效，如果能够正常地调用 `CreateTodo`页面，则证明配置正确：

``` sh
adb shell am start -W -a "android.intent.action.VIEW" -d "yourUri" yourPackageName
```

在 Todo 例子里就是：

``` sh
adb shell am start -W -a "android.intent.action.VIEW"  \
  -d "com.leancloud.todo://leancloud/classes/Todo/5371f3a9e4b02f7aee2c9a18" \
  com.avos.demo
```

如果一切正常的话，这将直接打开应用并在 `CreateTodo` 里展现 objectId 为 `536cf746e4b0d914a19ec9b3` 的 Todo 对象数据数据。