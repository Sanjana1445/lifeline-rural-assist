
const AlertBanner = ({ message }: { message: string }) => {
  return (
    <div className="bg-white p-3 mb-6">
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export default AlertBanner;
