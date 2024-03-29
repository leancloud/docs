# 排行榜开发指南 &middot; .Net

## 安装 SDK

排行榜是存储 SDK 中的一个模块，需要安装存储 SDK，请参考《[C# SDK 安装指南](sdk_setup-dotnet-standard.html)》。

### LCLeaderboard

`LCLeaderboard` 类是对排行榜的抽象。`Leaderboard` 实例有以下属性：

|属性|类型|说明|
|:--:|:--:|--|
|`StatisticName`|`string`|所排名的成绩名字|
|`Order`|`LCLeaderboardOrder`|排序|
|`UpdateStrategy`|`LCLeaderboardUpdateStrategy`|成绩更新策略|
|`VersionChangeInterval`|`LCLeaderboardVersionChangeInterval`|自动重置周期|
|`Version`|`int`|版本|
|`NextResetAt`|`DateTime`|计划下次重置时间|
|`CreatedAt`|`DateTime`|创建时间|

### Statistic

排行榜是对用户的成绩进行排名的结果。SDK 提供了一个 `Statistic` 类来表示成绩。`Statistic` 实例有以下属性：

|属性|类型|说明|
|:--:|:--:|--|
|`Name`|`string`|成绩名字，对应排行榜的 `StatisticName`|
|`Value`|`double`|成绩值|

### Ranking

排行榜排序的结果是一个数组，数组的成员是一个叫 `Ranking` 的结构：

|属性|类型|说明|
|:--:|:--:|--|
|`Rank`|`int`|排名，从 0 开始|
|`User`|`LCUser`|拥有该成绩的用户|
|`Value`|`double`|该用户的成绩|
|`IncludedStatistics`|`List<Statistic>`|该用户的其他成绩|

### 用户

排行榜中的用户指的是内建账户系统中的用户。在客户端，只有登录后才能更新当前登录用户的成绩。您可以通过《[数据存储开发指南 - 用户](leanstorage_guide-dotnet.html#用户)》了解更多用户系统的功能与用法。

## 用户成绩管理

### 更新成绩

当用户完成了一局游戏后，你可以使用 SDK 的 `updateStatistic` 方法更新该用户的成绩。

```c#
var statistic = new Dictionary<string, double> {
    { "score", 3458 },
    { "kills", 28 }
};
await LCLeaderboard.UpdateStatistics(user, statistic);
```

`updateStatistic` 方法的第二个参数是一个 key-value 的对象，key 为要更新的 `statisticName`，value 为要更新的成绩。你可以一次更新多个不同的成绩。

更新成绩 API 需要用户登录，且用户只能更新自己的成绩。也可使用 masterKey 更新任意用户的成绩。

#### 强制更新成绩

有些情况下，你会想要绕过排行榜的 [更新策略](leaderboard.html#更新策略) 强制更新用户的成绩，你可以使用 `overwrite` 参数实现这一需求：

```c#
var statistic = new Dictionary<string, double> {
    { "score", 0 }
};
await LCLeaderboard.UpdateStatistics(user, statistic, overwrite: true);
```

### 查询成绩

你可以通过 `GetStatistics` 方法查询某用户的某些成绩：

```c#
// 当前用户需要先登录
var user = await LCUser.Login("123", "123");
// 构造要查询的用户
var otherUser = LCObject.CreateWithoutData<LCUser>("5c76107144d90400536fc88b");
// 获取其他用户在排行榜中的成绩
var statistics = await LCLeaderboard.GetStatistics(otherUser, new List<string> { "world" });
foreach(var statistic in statistics) {
  Debug.Log(statistic.Name);
  Debug.Log(statistic.Value.ToString());
}
```

你也可以省略 `statisticNames` 选项用来查询某用户的所有成绩：

```c#
// 当前用户需要先登录
var user = await LCUser.Login("123", "123");
// 构造要查询的用户
var otherUser = LCObject.CreateWithoutData<LCUser>("5c76107144d90400536fc88b");
// 获取其他用户在排行榜中的成绩
var statistics = await LCLeaderboard.GetStatistics(otherUser);
foreach(var statistic in statistics) {
  Debug.Log(statistic.Name);
  Debug.Log(statistic.Value.ToString());
}
```

## 获取排行榜结果

SDK 提供了两种获取排行榜结果的 API：

|方法|作用|
|--|--|
|`Leaderboard#getResults`|获取指定区间的排名|
|`Leaderboard#getResultsAroundUser`|获取指定用户附近的排名|


### 获取指定区间的排名

获取排行榜结果最常见的使用场景是获取排名前 N 的用户成绩。


```c#
var leaderboard = LCLeaderboard.CreateWithoutData("world");
var rankings = await leaderboard.GetResults(limit: 10, skip: 0);
foreach(var ranking in rankings) {
    Debug.Log(ranking.User.Username);
    Debug.Log(ranking.Rank.ToString());
    Debug.Log(ranking.Value);
}
```

`Leaderboard#getResults` 方法的第一个参数包含以下选项：

|选项名|类型|说明
|:--:|:--:|--|
|`limit`|`number`|限制返回的结果数量|
|`skip`|`number`| 指定从某个位置开始获取，与 `limit` 一起可以实现翻页|
|`selectUserKeys`|`string[]`|指定返回的 `Ranking` 中的 `user` 需要包含的属性|
|`includeStatistics`|`string[]`|指定返回的 `Ranking` 中需要包含的其他成绩|
|`version`|`number`|指定返回某个历史版本的成绩|

默认情况下返回的排行榜结果中的 `user` 是一个只有 `id` 属性的 `LCUser` Pointer。如果想要像下面这个例子一样，在排行榜结果中显示用户名或者其他的用户属性（对应 `_User` 表中的属性），那么需要使用 `selectUserKeys` 选项。

|排名|Username|Age|Score↓|
|:--:|--|:--:|:--:|
|0|Genji|35|3458|
|1|Lúcio|26|3252|
|2|D.Va|19|3140|


```cs
var leaderboard = LCLeaderboard.CreateWithoutData("world");
var rankings = await leaderboard.GetResults(limit: 10, selectUserKeys: new List<string> { "username", "age" });
foreach(var ranking in rankings) {
    Debug.Log(ranking.User.Username);
    Debug.Log(ranking.Rank.ToString());
    Debug.Log(ranking.Value);
}
```

类似的，如果想要在排行榜结果中包含用户的其他成绩，可以使用 `includeStatistics` 选项。

|排名|Username|Score↓|Kills
|:--:|--|:--:|:--:|
|0|Genji|3458|28|
|1|Lúcio|3252|2|
|2|D.Va|3140|31|

```c#
var leaderboard = LCLeaderboard.CreateWithoutData("world");
var rankings = await leaderboard.GetResults(limit: 10, includeStatistics: new List<string> { "kills" });
foreach(var ranking in rankings) {
    Debug.Log(ranking.User.Username);
    Debug.Log(ranking.Rank.ToString());
    Debug.Log(ranking.Value);
}
```

### 获取当前用户附近的排名

另一种常见的需求是获取当前登录用户附近的排名：

|排名|Username|Score↓|
|:--:|--|:--:|
|…|||
|24|Bastion|716|
|25 (You)|Widowmaker|698|
|26|Hanzo|23|
|…||||

```c#
var leaderboard = LCLeaderboard.CreateWithoutData("world");
var rankings = await leaderboard.GetResultsAroundUser(limit: 3);
foreach(var ranking in rankings) {
    Debug.Log(ranking.User.Username);
    Debug.Log(ranking.Rank.ToString());
    Debug.Log(ranking.Value);
}
```

`Leaderboard#getResultsAroundUser` 方法的第一个参数包含以下选项：

|选项名|类型|说明
|:--:|:--:|--|
|`limit`|`number`|限制返回的结果数量，当前用户会在结果的中间位置|
|`selectUserKeys`|`string[]`|指定返回的 `Ranking` 中的 `user` 需要包含的属性|
|`includeStatistics`|`string[]`|指定返回的 `Ranking` 中需要包含的其他成绩|
|`version`|`number`|指定返回某个历史版本的成绩|

各参数的适用场景与用法与上文 `Leaderboard#getResults` 的参数类似，不再详述。

#### 获取当前用户的排名

如果仅需要获取当前用户的排名，使用 [获取当前用户附近的排名](#获取指定用户附近的排名) 中的 `Leaderboard#getResultsAroundUser` 方法并指定 `limit` 为 1 时即可。

## 管理排行榜

您可以在控制台的「游戏 - 排行榜 - 数据」页面完成排行榜的创建、重置、修改以及删除等操作。除此之外您也可以通过调用 SDK 的 API 来管理排行榜。

请注意，管理排行榜 API 需要 masterKey，因此只能在服务端等可信任的环境中调用。

**masterKey 意味着超级权限，禁止在客户端使用。**

使用 masterKey 应用的初始方法如下：

```c#
LCApplication.Initialize({{appid}}, {{appkey}}, "https://xxx.example.com", {{masterkey}});
LCApplication.UseMasterKey = true;
```

### 创建排行榜

```c#
var leaderboard = await LCLeaderboard.CreateLeaderboard("score", order: LCLeaderboardOrder.ASCENDING, updateStrategy: LCLeaderboardUpdateStrategy.BETTER);
```

你可以指定以下参数：

|参数|类型|是否可选|默认值|说明|
|:--:|:--:|:--:|:--:|--|
|`statisticName`|`string`|||所排名的成绩名字|
|`order`|`LCLeaderboardOrder`|||排序|
|`updateStrategy`|`LCLeaderboardUpdateStrategy`|可选|`LCLeaderboardUpdateStrategy.BETTER`|成绩更新策略|
|`versionChangeInterval`|`LCLeaderboardVersionChangeInterval`|可选|`LCLeaderboardVersionChangeInterval.WEEK`|自动重置周期|

### 手动重置排行榜

排行榜在创建之后会按照自动重置周期的设置自动定期重置，重置后该排行榜中所有用户的成绩都会被清空，你可以在控制台的历史版本中找到历史版本的归档。你也可以随时调用重置排行榜的接口手动进行重置。

```c#
var leaderboard = LCLeaderboard.CreateWithoutData("score");
await leaderboard.Reset();
```

**重置排行榜接口需要使用 masterKey。**

### 获取排行榜属性
通过这个接口可以获得当前排行榜的属性，例如：重置周期、版本号、更新策略等。

```c#
var leaderboardData = await LCLeaderboard.GetLeaderboard("world");
```

### 修改排行榜属性

排行榜创建后，名字与成绩排序方式不可修改。

自动重置周期可以通过调用以下 API 修改：

```c#
var leaderboard = LCLeaderboard.CreateWithoutData("equip");
await leaderboard.UpdateVersionChangeInterval(LCLeaderboardVersionChangeInterval.WEEK);
```

成绩更新策略可以通过调用以下 API 修改：

```c#
var leaderboard = LCLeaderboard.CreateWithoutData("equip");
await leaderboard.UpdateUpdateStrategy(LCLeaderboardUpdateStrategy.LAST);
```

**修改排行榜属性接口需要使用 masterKey。**

### 删除排行榜

```c#
var leaderboard = LCLeaderboard.CreateWithoutData("equip");
await leaderboard.Destroy();
```

**删除排行榜会删除该排行榜的所有数据，包括当前数据及所有历史版本归档。**
**删除排行榜接口需要使用 masterKey。**
