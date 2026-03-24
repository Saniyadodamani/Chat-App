import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { AuthContext } from "./AutoContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [isTyping, setIsTyping] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);

    const { socket, axios, authUser } = useContext(AuthContext);

    // Ref so socket handlers always have the latest selectedUser without needing resubscription
    const selectedUserRef = useRef(selectedUser);
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    const usersRef = useRef(users);
    useEffect(() => {
        usersRef.current = users;
    }, [users]);

    const getUsers = useCallback(async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                const normalized = {};
                if (data.unseenMessages) {
                    Object.keys(data.unseenMessages).forEach((k) => {
                        normalized[String(k)] = data.unseenMessages[k];
                    });
                }
                setUnseenMessages(normalized);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }, [axios]);

    useEffect(() => {
        if (authUser) {
            getUsers();
        }
    }, [authUser, getUsers]);

    const getMessages = useCallback(async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }, [axios]);

    const sendMessage = async (messageData) => {
        if (!selectedUser?._id) {
            toast.error("Select a user to chat");
            return;
        }
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.message]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const deleteMessage = async (messageId) => {
        try {
            const { data } = await axios.delete(`/api/messages/delete/${messageId}`);
            if (data.success) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m._id === messageId ? { ...m, deleted: true, text: "", image: "", voice: "" } : m
                    )
                );
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Emit typing events
    const emitTyping = useCallback(() => {
        if (socket && selectedUser) {
            socket.emit("typing", { to: String(selectedUser._id) });
        }
    }, [socket, selectedUser]);

    const emitStopTyping = useCallback(() => {
        if (socket && selectedUser) {
            socket.emit("stopTyping", { to: String(selectedUser._id) });
        }
    }, [socket, selectedUser]);

    // ─── STABLE socket subscription — only depends on socket & axios ───────────
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            const senderId = String(newMessage.senderId);
            const selectedId = selectedUserRef.current?._id
                ? String(selectedUserRef.current._id)
                : null;

            if (selectedId && senderId === selectedId) {
                // Chat is open — mark immediately as seen
                newMessage.seen = true;
                setMessages((prev) => [...prev, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`).catch(console.error);
            } else {
                // Chat not open — show notification + unseen badge
                const senderUser = usersRef.current.find(u => String(u._id) === senderId);

                if (Notification.permission === "granted") {
                    new Notification(senderUser?.fullName || "New Message", {
                        body: newMessage.text || "📷 Media",
                        icon: senderUser?.profilePic || "/favicon.jpg",
                    });
                } else if (Notification.permission !== "denied") {
                    Notification.requestPermission();
                }

                setUnseenMessages((prev) => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1,
                }));
            }
        };

        const handleTyping = ({ from }) => {
            if (selectedUserRef.current && String(selectedUserRef.current._id) === String(from)) {
                setIsTyping(true);
            }
        };

        const handleStopTyping = ({ from }) => {
            if (selectedUserRef.current && String(selectedUserRef.current._id) === String(from)) {
                setIsTyping(false);
            }
        };

        // messageSeen: update ALL current messages to seen instantly
        const handleMessageSeen = () => {
            setMessages((prev) => prev.map((m) => ({ ...m, seen: true })));
        };

        const handleMessageDeleted = ({ messageId }) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m._id === messageId
                        ? { ...m, deleted: true, text: "", image: "", voice: "" }
                        : m
                )
            );
        };

        socket.on("newMessage", handleNewMessage);
        socket.on("typing", handleTyping);
        socket.on("stopTyping", handleStopTyping);
        socket.on("messageSeen", handleMessageSeen);
        socket.on("messageDeleted", handleMessageDeleted);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("typing", handleTyping);
            socket.off("stopTyping", handleStopTyping);
            socket.off("messageSeen", handleMessageSeen);
            socket.off("messageDeleted", handleMessageDeleted);
        };
    }, [socket, axios]); // ← no selectedUser here: ref handles that
    // ────────────────────────────────────────────────────────────────────────────

    // Reset typing & panel when changing chats
    useEffect(() => {
        setIsTyping(false);
        setShowRightPanel(false);
    }, [selectedUser]);

    const value = {
        messages, users, selectedUser, getUsers, getMessages, sendMessage, deleteMessage,
        setSelectedUser, unseenMessages, setUnseenMessages,
        isTyping, emitTyping, emitStopTyping,
        showRightPanel, setShowRightPanel,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
