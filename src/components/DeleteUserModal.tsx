/**
 * Delete User Modal Component
 * Confirmation modal for deleting users with safety checks
 */

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from "@/lib/database.types";
import { deleteUser } from "@/lib/hooks/useUserManagement";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import React, { useState } from "react";

type UserRole = Database["public"]["Enums"]["user_role"];

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
  userName,
  userEmail,
  userRole,
}) => {
  const [confirmationText, setConfirmationText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  const expectedConfirmation = "DELETE";
  const isConfirmationValid = confirmationText === expectedConfirmation;

  // Check if user is a high-privilege user
  const isHighPrivilegeUser = ["admin"].includes(userRole);

  const handleClose = () => {
    setConfirmationText("");
    setErrors([]);
    setSuccessMessage("");
    onClose();
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setErrors([]);
    setSuccessMessage("");

    try {
      if (!isConfirmationValid) {
        setErrors(['Please type "DELETE" to confirm']);
        return;
      }

      const result = await deleteUser(userId);

      if (result.success) {
        setSuccessMessage("User has been successfully deleted.");

        // Close modal and refresh data after 1.5 seconds
        setTimeout(() => {
          handleClose();
          onSuccess();
        }, 1500);
      } else {
        setErrors([result.error || "Failed to delete user"]);
      }
    } catch (error) {
      setErrors(["An unexpected error occurred while deleting the user"]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "text-red-600 bg-red-100";
      case "staff":
        return "text-green-600 bg-green-100";
      case "customer":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    return role
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete User
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user
            account and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success Message */}
          {successMessage && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-red-800">
                      {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* User Information */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{userName}</h4>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userRole)}`}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleLabel(userRole)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{userEmail}</p>
                <p className="text-xs text-gray-500 mt-1">ID: {userId}</p>
              </div>
            </div>
          </div>

          {/* High-privilege user warning */}
          {isHighPrivilegeUser && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Warning:</strong> You are about to delete a user with
                elevated privileges ({getRoleLabel(userRole)}). This action will
                remove all their permissions and access rights.
              </AlertDescription>
            </Alert>
          )}

          {/* Data loss warning */}
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Deleting this user will also remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All job orders associated with this user</li>
                <li>Customer data and transaction history</li>
                <li>User preferences and settings</li>
                <li>Any pending notifications</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                DELETE
              </code>{" "}
              to confirm
            </Label>
            <Input
              id="confirmation"
              type="text"
              placeholder="Type DELETE to confirm"
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value);
                setErrors([]);
              }}
              disabled={isLoading}
              className={
                confirmationText && !isConfirmationValid ? "border-red-300" : ""
              }
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-sm text-red-600">
                Please type &quot;DELETE&quot; exactly as shown
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isLoading || !isConfirmationValid}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteUserModal;
