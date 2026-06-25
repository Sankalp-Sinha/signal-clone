export type Conversation = {
  id: number;
  name: string;
  type: "direct" | "group";
  last_message: string;
  unread_count: number;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export async function getConversations(userId: number): Promise<Conversation[]> {
  const response = await fetch(`${API_URL}/conversations/?user_id=${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return response.json();
}

export type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  status: string;
  is_read: boolean;
  created_at: string;
};

export async function getMessages(conversationId: number): Promise<Message[]> {
  const response = await fetch(`${API_URL}/messages/${conversationId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  return response.json();
}

export async function sendMessage(
  conversationId: number,
  senderId: number,
  content: string
): Promise<Message> {
  const response = await fetch(`${API_URL}/messages/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  return response.json();
}


export type User = {
  id: number;
  username: string;
  display_name: string;
  phone: string;
  avatar_url: string;
};

export async function login(username: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
}

export async function verifyOtp(username: string, otp: string): Promise<User> {
  const response = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, otp }),
  });

  if (!response.ok) {
    throw new Error("Invalid OTP");
  }

  const data = await response.json();
  return data.user;
}

export async function registerUser(
  username: string,
  phone: string,
  displayName: string
) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      phone,
      display_name: displayName,
    }),
  });

  if (!response.ok) {
    throw new Error("Registration failed");
  }

  return response.json();
}

export async function createDirectConversation(
  currentUserId: number,
  targetUsername: string
): Promise<Conversation | { error: string }> {
  const response = await fetch(`${API_URL}/conversations/direct`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      current_user_id: currentUserId,
      target_username: targetUsername,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create conversation");
  }

  return response.json();
}

export async function markConversationRead(
  conversationId: number,
  userId: number
) {
  await fetch(
    `${API_URL}/conversations/${conversationId}/read?user_id=${userId}`,
    {
      method: "POST",
    }
  );
}

export async function createGroupConversation(
  currentUserId: number,
  name: string,
  memberUsernames: string[]
): Promise<Conversation> {
  const response = await fetch(`${API_URL}/conversations/group`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      current_user_id: currentUserId,
      name,
      member_usernames: memberUsernames,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create group");
  }

  return response.json();
}


export type GroupMember = {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  role: string;
};

export async function getGroupMembers(
  conversationId: number
): Promise<GroupMember[]> {
  const response = await fetch(`${API_URL}/conversations/${conversationId}/members`);

  if (!response.ok) {
    throw new Error("Failed to fetch group members");
  }

  return response.json();
}

export async function addGroupMember(
  conversationId: number,
  username: string
) {
  const response = await fetch(
    `${API_URL}/conversations/${conversationId}/members`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to add member");
  }

  return response.json();
}

export async function removeGroupMember(
  conversationId: number,
  userId: number
) {
  const response = await fetch(
    `${API_URL}/conversations/${conversationId}/members/${userId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to remove member");
  }

  return response.json();
}