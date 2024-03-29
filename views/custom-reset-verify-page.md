# 自定义邮件验证和重设密码页面

默认情况下，邮件验证、重设密码将使用 LeanCloud 提供的页面。
如果你希望用户跳转到你的网站来验证邮箱或者修改密码，可以自定义这两个页面。

## 自定义邮件验证页面

0. 从「控制台 > 内建账户 > 邮件模板 > 自定义邮件验证页面」下载 HTML 模板文件 `verify-template.html`。 

1. 修改项目中的 `verify-template.html` 文件，将

    ```js
    var url = "https://api.example.com/1.1/verifyEmail/";
    ```

    中的 `api.example.com` 替换为你的应用绑定的[自定义 API 域名](custom-api-domain-guide.html#API_域名)。

2. （可选）可以根据项目需求在页面添加更多功能，比如在页面上添加应用名称、联系方式，设置验证成功后跳转到应用网站等。

3. 将 `verify-template.html` 重命名为 `verify.html` （可以根据需要使用其他的文件名称）。

4. 使用命令行工具 [lean-cli](leanengine_cli.html) [初始化项目](leanengine_quickstart.html) 时选择 `Others > Static Site`，创建一个纯静态站点。在项目中加入 `verify.html` 文件，然后部署到云引擎生产环境（`lean deploy --prod 1`）。你也可以将 `verify.html` 部署到自己的服务器上，并配置相应的路由。

5. 在「控制台 > 内建账户 > 邮件模板 > 自定义邮件验证页面」填写 url：`https://www.example.com/verify`，其中 `www.example.com` 是你的应用绑定的[自定义云引擎域名](custom-api-domain-guide.html#云引擎域名)或者你自己的服务器使用的域名。

## 自定义重设密码页面

和「自定义邮件验证页面」的步骤几乎完全一样，只不过模板文件的名称是 `reset-template.html`（相应地，可以重命名为 `reset.html`），修改的代码行为：

```js
url:"https://api.example.com/1/resetPassword/"+token,
```

最后同样在「控制台 > 内建账户 > 邮件模板 > 自定义重设密码页面」填写 `https://www.example.com/reset` 即可（注意替换域名）。

## 自定义邮件模板

默认发送的邮件验证邮件和重设密码邮件的内容可以在「控制台 > 内建账户 > 邮件模板」看到。

你可以修改邮件主题和内容，保存后即可生效。
主题和内容都支持 [handlebar 模板](http://handlebarsjs.com/)，并且预定义了部分变量。

验证邮箱邮件中支持的变量包括：

* `appname` - 应用名称
* `email` - 用户邮箱地址
* `username` - 用户的用户名
* `link` - 验证邮箱的链接，即控制台「自定义邮件验证页面」中填写的 `url`，默认是 LeanCloud 提供的页面。

重设密码邮件中支持的变量包括 `appname`、`username`、`link`。