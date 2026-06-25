"use client";

import { useEffect, useRef, useState } from "react";
import {
  Conversation,
  Message,
  User,
  getConversations,
  getMessages,
  sendMessage,
  createDirectConversation,
  createGroupConversation,
  markConversationRead,
  GroupMember,
  getGroupMembers,
  WS_URL,
  addGroupMember,
  removeGroupMember,
} from "@/lib/api";

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      window.location.href = "/login";
      return;
    }

    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    getConversations(user.id).then(setConversations).catch(console.error);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(async () => {
      try {
        const updated = await getConversations(currentUser.id);
        setConversations(updated);
      } catch (error) {
        console.error(error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser]);
  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function openConversation(conversation: Conversation) {
    setSelectedConversation(conversation);
    setShowGroupInfo(false);

    const data = await getMessages(conversation.id);
    setMessages(data);
    if (conversation.type === "group") {
      const members = await getGroupMembers(conversation.id);
      setGroupMembers(members);
    } else {
      setGroupMembers([]);
    }

    if (currentUser) {
      await markConversationRead(
        conversation.id,
        currentUser.id
      );

      const updated = await getConversations(currentUser.id);
      setConversations(updated);
    }

    if (socketRef.current) socketRef.current.close();

    const ws = new WebSocket(`${WS_URL}/ws/${conversation.id}`);

    ws.onopen = () => console.log("WebSocket connected");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "typing") {
        if (data.user === currentUser?.display_name) {
          return;
        }

        setTypingUser(data.user);

        setTimeout(() => {
          setTypingUser("");
        }, 1500);

        return;
      }

      setMessages((prev) => [...prev, data]);
    };

    ws.onerror = (error) => console.error("WebSocket error:", error);

    socketRef.current = ws;
  }

  async function handleSendMessage() {
    if (!selectedConversation || !currentUser || messageText.trim() === "") return;

    const newMessage = await sendMessage(
      selectedConversation.id,
      currentUser.id,
      messageText.trim()
    );

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(newMessage));
    } else {
      setMessages((prev) => [...prev, newMessage]);
    }

    setMessageText("");
  }

  function handleLogout() {
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  async function handleNewChat() {
    if (!currentUser) return;

    const username = prompt("Enter username");

    if (!username) return;

    try {
      const newConversation = await createDirectConversation(
        currentUser.id,
        username
      );

      if ("error" in newConversation) {
        alert(`User with username "${username}" does not exist`);
        return;
      }

      const updatedConversations = await getConversations(currentUser.id);
      setConversations(updatedConversations);
    } catch (error) {
      alert(`User with username "${username}" does not exist`);
    }
  }

  async function handleCreateGroup() {
    if (!currentUser) return;

    const groupName = prompt("Enter group name");

    if (!groupName) return;

    const membersInput = prompt(
      "Enter member usernames separated by comma, example: alice,bob"
    );

    const memberUsernames = membersInput
      ? membersInput
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
      : [];

    try {
      await createGroupConversation(
        currentUser.id,
        groupName,
        memberUsernames
      );

      const updatedConversations = await getConversations(currentUser.id);
      setConversations(updatedConversations);

      alert("Group created successfully");
    } catch {
      alert("Failed to create group");
    }
  }

  async function handleAddMember() {
    if (!selectedConversation) return;

    const username = prompt("Enter username to add");

    if (!username) return;

    const result = await addGroupMember(selectedConversation.id, username);

    if ("error" in result) {
      alert(result.error);
      return;
    }

    const members = await getGroupMembers(selectedConversation.id);
    setGroupMembers(members);

    alert("Member added successfully");
  }

  async function handleRemoveMember(userId: number) {
    if (!selectedConversation) return;

    const confirmRemove = confirm("Remove this member from group?");

    if (!confirmRemove) return;

    const result = await removeGroupMember(selectedConversation.id, userId);

    if ("error" in result) {
      alert(result.error);
      return;
    }

    const members = await getGroupMembers(selectedConversation.id);
    setGroupMembers(members);

    alert("Member removed successfully");
  }

  return (
    <main
      className={`flex h-screen ${darkMode
        ? "bg-[#111827] text-white"
        : "bg-[#f6f6f6] text-black"
        }`}
    >
      <aside
        className={`w-[380px] border-r ${darkMode
          ? "border-gray-700 bg-[#1f2937]"
          : "border-gray-200 bg-white"
          }`}
      >
        <div className="border-b border-gray-200 p-5">
          <h1 className="text-4xl font-bold text-blue-500">Signal</h1>

          <p className="mt-1 text-sm text-gray-500">
            Logged in as <strong>{currentUser?.display_name}</strong>
          </p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`rounded-full bg-gray-200 px-4 py-2 text-sm ${darkMode ? "text-black" : "text-gray-700"
                }`}
            >
              {darkMode ? "Light" : "Dark"}
            </button>

            <button
              onClick={() => (window.location.href = "/settings")}
              className={`rounded-full bg-gray-200 px-4 py-2 text-sm ${darkMode ? "text-black" : "text-gray-700"
                }`}
            >
              Settings
            </button>

            <button
              onClick={handleLogout}
              className="rounded-full bg-red-500 px-4 py-2 text-sm text-white"
            >
              Logout
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleNewChat}
              className="flex-1 rounded-full bg-blue-500 py-2 text-white"
            >
              + New Chat
            </button>

            <button
              onClick={handleCreateGroup}
              className="flex-1 rounded-full bg-green-500 py-2 text-white"
            >
              + New Group
            </button>
          </div>
        </div>

        <div className="p-3">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-full px-4 py-2 text-sm outline-none ${darkMode
              ? "bg-[#374151] text-white"
              : "bg-gray-100"
              }`}
            placeholder="Search"
          />
        </div>

        {filteredConversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => openConversation(conversation)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left ${darkMode
              ? "hover:bg-[#374151]"
              : "hover:bg-gray-100"
              } ${selectedConversation?.id === conversation.id
                ? darkMode
                  ? "bg-[#374151]"
                  : "bg-gray-100"
                : ""
              }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
              {conversation.name[0]}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex justify-between">
                <p className="truncate font-medium">{conversation.name}</p>
                <span className="text-xs text-gray-400">now</span>
              </div>

              <p
                className={`truncate text-sm ${darkMode
                  ? "text-gray-300"
                  : "text-gray-500"
                  }`}
              >
                {conversation.last_message}
              </p>
            </div>

            {conversation.unread_count > 0 && (
              <span className="rounded-full bg-blue-500 px-2 py-1 text-xs text-white">
                {conversation.unread_count}
              </span>
            )}
          </button>
        ))}

        {filteredConversations.length === 0 && (
          <p className="px-5 py-4 text-sm text-gray-400">No conversations found</p>
        )}
      </aside>

      <section className="flex flex-1 flex-col">
        {selectedConversation ? (
          <>
            <div
              className={`flex items-center justify-between border-b px-6 py-4 ${darkMode
                ? "border-gray-700 bg-[#1f2937]"
                : "border-gray-200 bg-white"
                }`}
            >              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                  {selectedConversation.name[0]}
                </div>

                <div>
                  <h2 className="font-semibold">{selectedConversation.name}</h2>
                  <p className="text-xs text-green-600">
                    {selectedConversation.type === "group"
                      ? `Group • ${groupMembers.length || "?"} members`
                      : "Online"}
                  </p>
                </div>
              </div>

              {selectedConversation.type === "group" && (
                <button
                  onClick={async () => {
                    if (!selectedConversation) return;

                    const members = await getGroupMembers(selectedConversation.id);
                    setGroupMembers(members);

                    setShowGroupInfo((prev) => !prev);
                  }}
                  className="rounded-full border px-3 py-1 text-sm text-gray-600"
                >
                  Group info
                </button>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-6">
              {messages.map((message) => {
                const isMe = message.sender_id === currentUser?.id;

                return (
                  <div
                    key={`${message.id}-${message.created_at}-${message.content}`}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[60%] rounded-2xl px-4 py-2 text-sm ${isMe
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-900"
                        }`}
                    >
                      <p>{message.content}</p>
                      <div
                        className={`mt-1 text-right text-[10px] ${isMe ? "text-blue-100" : "text-gray-400"
                          }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {isMe && "✓✓"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {typingUser && (
              <div className="px-6 pb-2 text-sm text-gray-500">
                {typingUser} is typing...
              </div>
            )}

            <div
              className={`border-t p-4 ${darkMode
                ? "border-gray-700 bg-[#1f2937]"
                : "border-gray-200 bg-white"
                }`}
            >              <div
              className={`flex items-center gap-3 rounded-full px-4 py-2 ${darkMode ? "bg-[#374151]" : "bg-gray-100"
                }`}
            >
                <input
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);

                    if (
                      socketRef.current &&
                      socketRef.current.readyState === WebSocket.OPEN &&
                      selectedConversation
                    ) {
                      socketRef.current.send(
                        JSON.stringify({
                          type: "typing",
                          user: currentUser?.display_name || "Someone",
                          conversation_id: selectedConversation.id,
                        })
                      );
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  className={`flex-1 bg-transparent text-sm outline-none ${darkMode ? "text-white placeholder:text-gray-400" : "text-black"
                    }`}
                  placeholder="Signal message"
                />

                <button
                  onClick={handleSendMessage}
                  className="rounded-full bg-blue-500 px-4 py-2 text-sm text-white"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-center text-gray-500">
            <div>
              <h2 className="text-2xl font-semibold">Select a conversation</h2>
              <p className="mt-2">Your messages will appear here.</p>
            </div>
          </div>
        )}
      </section>

      {showGroupInfo && selectedConversation?.type === "group" && (
        <aside className="w-[320px] border-l border-gray-200 bg-white p-5">
          <h3 className="text-lg font-semibold">Group info</h3>

          <div className="mt-5 flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-semibold text-blue-600">
              {selectedConversation.name[0]}
            </div>
            <h4 className="mt-3 font-semibold">{selectedConversation.name}</h4>
            <p className="text-sm text-gray-500">
              {groupMembers.length} members
            </p>
          </div>

          <div className="mt-6">
            <h4 className="mb-3 text-sm font-semibold text-gray-500">Members</h4>

            {groupMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 font-medium text-gray-600">
                  {member.display_name[0]}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium">{member.display_name}</p>
                  <p className="text-xs text-gray-400">
                    {member.role === "admin" ? "Admin" : "Member"}
                  </p>
                </div>

                {member.role !== "admin" && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={handleAddMember}
              className="w-full rounded-lg bg-blue-500 py-2 text-sm text-white"
            >
              Add member
            </button>

            <button className="w-full rounded-lg bg-gray-100 py-2 text-sm text-gray-700">
              Rename group
            </button>

            <button className="w-full rounded-lg bg-red-50 py-2 text-sm text-red-600">
              Leave group
            </button>
          </div>
        </aside>
      )}
    </main>
  );
}