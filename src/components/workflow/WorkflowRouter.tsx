
import { useParams, useNavigate, Route, Routes, Navigate } from "react-router-dom";
import TaskMatrixContent from "./TaskMatrixContent";
import TrainingMatrixContent from "./TrainingMatrixContent";
import FormMatrixContent from "./FormMatrixContent";

const WorkflowRouter = () => {
  const { id, branchName } = useParams();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="task-matrix" replace />} />
      <Route path="/task-matrix" element={<TaskMatrixContent />} />
      <Route path="/training-matrix" element={<TrainingMatrixContent />} />
      <Route path="/form-matrix" element={<FormMatrixContent />} />
    </Routes>
  );
};

export default WorkflowRouter;
