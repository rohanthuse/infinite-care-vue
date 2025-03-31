
import React from "react";

export interface MessageListProps {
  branchId: string;
  onMessageSelect: (messageId: string) => void;
  selectedMessageId: string | null;
  selectedFilter: "all" | "carers" | "clients" | "groups";
  searchTerm: string;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  branchId, 
  onMessageSelect, 
  selectedMessageId,
  selectedFilter,
  searchTerm
}) => {
  // Mock messages
  const messages = [
    { 
      id: "msg1", 
      sender: "John Doe",
      avatar: "JD",
      subject: "Schedule Change Request",
      content: "I need to change my schedule for next week...",
      time: "10:30 AM",
      date: "2023-06-15",
      unread: true,
      type: "clients"
    },
    { 
      id: "msg2", 
      sender: "Mary Smith",
      avatar: "MS",
      subject: "Medication Question",
      content: "I have a question about the new medication...",
      time: "Yesterday",
      date: "2023-06-14",
      unread: false,
      type: "clients"
    },
    { 
      id: "msg3", 
      sender: "James Wilson",
      avatar: "JW",
      subject: "Availability Update",
      content: "I'm available for extra shifts next month...",
      time: "Monday",
      date: "2023-06-12",
      unread: true,
      type: "carers"
    }
  ];

  // Filter messages based on filter and search term
  const filteredMessages = messages.filter(msg => {
    const matchesFilter = selectedFilter === "all" || msg.type === selectedFilter;
    const matchesSearch = 
      msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) || 
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="h-full overflow-y-auto border-r">
      {filteredMessages.length > 0 ? (
        <div className="divide-y">
          {filteredMessages.map(message => (
            <div 
              key={message.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedMessageId === message.id ? "bg-blue-50" : ""
              }`}
              onClick={() => onMessageSelect(message.id)}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {message.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium ${message.unread ? "font-semibold" : ""}`}>
                      {message.sender}
                    </h3>
                    <span className="text-xs text-gray-500">{message.time}</span>
                  </div>
                  <h4 className={`text-sm mt-1 ${message.unread ? "font-semibold" : ""}`}>
                    {message.subject}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {message.content}
                  </p>
                </div>
                {message.unread && (
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-2"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <div className="text-gray-400 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No messages found</p>
          <p className="text-xs text-gray-400 mt-1">
            {searchTerm ? "Try a different search term" : "Your inbox is empty"}
          </p>
        </div>
      )}
    </div>
  );
};
