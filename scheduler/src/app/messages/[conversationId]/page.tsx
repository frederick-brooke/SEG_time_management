export default function ConversationPage({ params }: { params: { conversationId: string } }) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
          Message thread goes here
        </div>
      </div>
    );
  }