import CSVUploader from "@/components/CSVuploader";
import React from "react";

const page = () => {
  return (
    <div className="w-full h-[90vh] flex flex-col items-center justify-center">
      <CSVUploader />
    </div>
  );
};

export default page;
