'use client';

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface Message {
  id: number;
  content: string;
  created_at: string;
}

const API_URL = "https://bahifinal.pythonanywhere.com/messages/";

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 600);

  useEffect(() => {
    fetchMessages();
    const handleResize = () => setIsSmallScreen(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data);
    } catch (error: any) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessageForm = async (method: "POST" | "PUT", url: string, message: Partial<Message> = {}) => {
    const { isConfirmed, value: formValues } = await Swal.fire({
      title: method === "POST" ? "Create SMS Message" : "Edit SMS Message",
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 1rem;">
            <label for="content" style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">SMS Content</label>
            <textarea 
              id="content" 
              class="swal2-textarea" 
              style="
                width: 100%;
                min-height: 120px;
                padding: 0.75rem;
                border: 1px solid #D1D5DB;
                border-radius: 0.375rem;
                background-color: #F9FAFB;
                font-family: inherit;
                transition: border-color 0.2s;
              "
              required
            >${message.content || ""}</textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: method === "POST" ? "Create" : "Update",
      confirmButtonColor: "#4F46E5",
      cancelButtonColor: "#6B7280",
      preConfirm: () => ({
        content: (document.getElementById("content") as HTMLTextAreaElement).value,
      }),
    });

    if (!isConfirmed) return;

    try {
      setLoading(true);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });
      if (!res.ok) throw new Error("Failed to send an SMS");
      Swal.fire("Success", "SMS sent successfully!", "success");
      fetchMessages();
    } catch (error: any) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id: number) => {
    const result = await Swal.fire({
      title: "Confirm Delete",
      text: "This SMS will be permanently deleted",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete message");
      Swal.fire("Deleted!", "SMS deleted successfully.", "success");
      fetchMessages();
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter messages by content
  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Styles for table and container
  const containerStyle = {
    width: isSmallScreen ? "95%" : "800px",
    margin: "2rem auto",
    padding: isSmallScreen ? "1rem" : "1.5rem",
    backgroundColor: "white",
    borderRadius: "0.5rem",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: isSmallScreen ? "0.875rem" : "0.9375rem",
    border: "1px solid #E5E7EB",
    borderRadius: "0.5rem",
    overflow: "hidden",
  };

  const thStyle = {
    padding: "0.75rem 1rem",
    backgroundColor: "#F9FAFB",
    borderBottom: "1px solid #E5E7EB",
    textAlign: "left" as const,
    fontWeight: 600,
    color: "#374151",
  };

  const tdStyle = {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #E5E7EB",
    textAlign: "left" as const,
    color: "#4B5563",
  };

  const actionButtonStyle = {
    background: "none",
    border: "none",
    color: "white",
    cursor: "pointer",
    marginRight: "0.5rem",
    padding: "0.375rem 0.75rem",
    borderRadius: "0.375rem",
    fontSize: "0.8125rem",
    fontWeight: 500,
    transition: "all 0.2s ease",
  };

  return (
    <div style={containerStyle}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid #E5E7EB"
      }}>
        <h2 style={{
          color: "#111827",
          fontSize: "1.25rem",
          fontWeight: 600,
          margin: 0
        }}>
          SMS Messages
        </h2>
        <button
          onClick={() => showMessageForm("POST", API_URL)}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#4F46E5",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "0.875rem",
            transition: "background-color 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4338CA")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4F46E5")}
        >
          <svg style={{ width: "1rem", height: "1rem" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create New
        </button>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            border: "1px solid #D1D5DB",
            borderRadius: "0.375rem",
            fontSize: "1rem",
            marginBottom: "0.5rem"
          }}
        />
      </div>

      <div style={{ overflowX: "auto", borderRadius: "0.5rem" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Content</th>
              <th style={thStyle}>Date</th>
              <th style={{ ...thStyle, width: "160px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ ...tdStyle, textAlign: "center", padding: "1.5rem" }}>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    backgroundColor: "#F9FAFB",
                    borderRadius: "0.375rem",
                    color: "#6B7280"
                  }}>
                    <svg style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Loading messages...
                  </div>
                </td>
              </tr>
            ) : filteredMessages.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ ...tdStyle, textAlign: "center", padding: "1.5rem", color: "#6B7280" }}>
                  No messages found
                </td>
              </tr>
            ) : (
              filteredMessages.map((message) => (
                <tr key={message.id}>
                  <td style={tdStyle}>
                    <div style={{
                      maxWidth: isSmallScreen ? "200px" : "400px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {message.content}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {new Date(message.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => showMessageForm("PUT", `${API_URL}${message.id}/`, message)}
                      style={{
                        ...actionButtonStyle,
                        backgroundColor: "#3B82F6",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2563EB")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3B82F6")}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMessage(message.id)}
                      style={{
                        ...actionButtonStyle,
                        backgroundColor: "#EF4444",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#DC2626")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#EF4444")}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}