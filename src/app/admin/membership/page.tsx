"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  isAdmin: boolean;
  createdAt: string;
  _count: {
    memberships: number;
    practices: number;
    sessions: number;
  };
}

interface Membership {
  id: string;
  type: "CREDIT" | "MONTHLY";
  status: string;
  totalCredits: number | null;
  usedCredits: number;
  startDate: string | null;
  endDate: string | null;
  note: string | null;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

interface UsageRecord {
  id: string;
  sourceType: string;
  sourceId: string;
  sourceTitle: string | null;
  membershipType: string;
  createdAt: string;
}

export default function AdminMembershipPage() {
  // 用户搜索
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 选中用户
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);

  // 开通会员表单
  const [grantType, setGrantType] = useState<"CREDIT" | "MONTHLY">("CREDIT");
  const [credits, setCredits] = useState(10);
  const [durationDays, setDurationDays] = useState(30);
  const [note, setNote] = useState("");
  const [isGranting, setIsGranting] = useState(false);
  const [grantMessage, setGrantMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 修复状态
  const [isFixing, setIsFixing] = useState(false);
  const [fixMessage, setFixMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);


  // 搜索用户
  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/admin/users?search=${encodeURIComponent(searchQuery)}`
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        alert("搜索失败");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("搜索失败");
    } finally {
      setIsSearching(false);
    }
  };

  // 选择用户
  // 修复用户会员状态
  const fixMembershipStatus = async () => {
    if (!selectedUser) return;

    setIsFixing(true);
    setFixMessage(null);

    try {
      const response = await fetch("/api/admin/membership/fix-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: selectedUser.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setFixMessage({
          type: "success",
          text: data.message,
        });
        // 刷新会员列表
        selectUser(selectedUser);
      } else {
        setFixMessage({
          type: "error",
          text: data.error || "修复失败",
        });
      }
    } catch (error) {
      console.error("Fix status error:", error);
      setFixMessage({ type: "error", text: "修复失败" });
    } finally {
      setIsFixing(false);
    }
  };

  // 修复单个会员状态
  const fixSingleMembership = async (membershipId: string) => {
    if (!selectedUser) return;

    try {
      const response = await fetch("/api/admin/membership/fix-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          membershipId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.fixed) {
        // 刷新会员列表
        selectUser(selectedUser);
      }
    } catch (error) {
      console.error("Fix single membership error:", error);
    }
  };

  const selectUser = async (user: User) => {
    setSelectedUser(user);
    setGrantMessage(null);
    setFixMessage(null);

    // 获取会员订单
    try {
      const membershipRes = await fetch(
        `/api/admin/membership?userId=${user.id}`);
      if (membershipRes.ok) {
        const data = await membershipRes.json();
        setMemberships(data.memberships);
      }

      // 获取消费记录
      const usageRes = await fetch(`/api/admin/usage?userId=${user.id}`);
      if (usageRes.ok) {
        const data = await usageRes.json();
        setUsageRecords(data.records);
      }
    } catch (error) {
      console.error("Load user data error:", error);
    }
  };

  // 开通会员
  const grantMembership = async () => {
    if (!selectedUser) return;

    setIsGranting(true);
    setGrantMessage(null);

    try {
      const response = await fetch("/api/admin/membership/grant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          type: grantType,
          credits: grantType === "CREDIT" ? credits : undefined,
          durationDays: grantType === "MONTHLY" ? durationDays : undefined,
          note: note || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGrantMessage({ type: "success", text: data.message });
        // 刷新会员列表
        selectUser(selectedUser);
      } else {
        setGrantMessage({ type: "error", text: data.error });
      }
    } catch (error) {
      console.error("Grant error:", error);
      setGrantMessage({ type: "error", text: "开通失败" });
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">会员管理</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：用户搜索 */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">搜索用户</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="邮箱或姓名"
                    onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                  />
                  <Button
                    onClick={searchUsers}
                    disabled={isSearching}
                    size="sm"
                  >
                    {isSearching ? "..." : "搜索"}
                  </Button>
                </div>

                {/* 用户列表 */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? "border-accent bg-accent/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.name || "未设置姓名"} · {user._count.memberships}{" "}
                        个会员
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：用户详情 */}
          <div className="lg:col-span-2 space-y-4">
            {selectedUser ? (
              <>
                {/* 用户信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">用户信息</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">邮箱</p>
                        <p className="font-medium">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">姓名</p>
                        <p className="font-medium">
                          {selectedUser.name || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">练习次数</p>
                        <p className="font-medium">
                          {selectedUser._count.practices}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">面试次数</p>
                        <p className="font-medium">
                          {selectedUser._count.sessions}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 开通会员 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">开通会员</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 类型选择 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGrantType("CREDIT")}
                        className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                          grantType === "CREDIT"
                            ? "border-accent bg-accent text-white"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        次卡
                      </button>
                      <button
                        onClick={() => setGrantType("MONTHLY")}
                        className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                          grantType === "MONTHLY"
                            ? "border-accent bg-accent text-white"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        月卡
                      </button>
                    </div>

                    {/* 参数 */}
                    {grantType === "CREDIT" ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          次数
                        </label>
                        <input
                          type="number"
                          value={credits}
                          onChange={(e) =>
                            setCredits(parseInt(e.target.value) || 0)
                          }
                          min={1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          有效期（天）
                        </label>
                        <input
                          type="number"
                          value={durationDays}
                          onChange={(e) =>
                            setDurationDays(parseInt(e.target.value) || 0)
                          }
                          min={1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    )}

                    {/* 备注 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        备注（可选）
                      </label>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="例如：试用开通"
                      />
                    </div>

                    {/* 消息 */}
                    {grantMessage && (
                      <div
                        className={`p-3 rounded-lg text-sm ${
                          grantMessage.type === "success"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {grantMessage.text}
                      </div>
                    )}

                    <Button
                      onClick={grantMembership}
                      disabled={isGranting}
                      className="w-full"
                    >
                      {isGranting ? "开通中..." : "确认开通"}
                    </Button>
                  </CardContent>
                </Card>

                {/* 会员订单 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">会员订单</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fixMembershipStatus}
                      disabled={isFixing}
                    >
                      {isFixing ? "修复中..." : "修复状态"}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {fixMessage && (
                      <div
                        className={`mb-4 p-3 rounded-lg text-sm ${
                          fixMessage.type === "success"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {fixMessage.text}
                      </div>
                    )}
                    {memberships.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        暂无会员订单
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {memberships.map((m) => (
                          <div
                            key={m.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  m.type === "CREDIT"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-purple-100 text-purple-700"
                                }`}
                              >
                                {m.type === "CREDIT" ? "次卡" : "月卡"}
                              </span>
                              <span
                                className={`text-xs ${
                                  m.status === "ACTIVE"
                                    ? "text-green-600"
                                    : m.status === "EXPIRED"
                                      ? "text-gray-500"
                                      : m.status === "CONSUMED"
                                        ? "text-amber-600"
                                        : "text-gray-500"
                                }`}
                              >
                                {m.status === "ACTIVE"
                                  ? "有效"
                                  : m.status === "EXPIRED"
                                    ? "已过期"
                                    : m.status === "CONSUMED"
                                      ? "已用完"
                                      : m.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700">
                              {m.type === "CREDIT" ? (
                                <span>
                                  已使用 {m.usedCredits}/{m.totalCredits} 次
                                </span>
                              ) : (
                                <span>
                                  有效期至{" "}
                                  {m.endDate
                                    ? new Date(m.endDate).toLocaleDateString()
                                    : "-"}
                                </span>
                              )}
                            </div>
                            {m.note && (
                              <p className="text-xs text-gray-500 mt-1">
                                备注：{m.note}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 消费记录 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">消费记录</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {usageRecords.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        暂无消费记录
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {usageRecords.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                          >
                            <div>
                              <p className="text-sm text-gray-900 truncate max-w-xs">
                                {r.sourceTitle || r.sourceId}
                              </p>
                              <p className="text-xs text-gray-500">
                                {r.sourceType === "PRACTICE"
                                  ? "单题练习"
                                  : "模拟面试"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {new Date(r.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-gray-500">
                    请先搜索并选择一个用户
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
