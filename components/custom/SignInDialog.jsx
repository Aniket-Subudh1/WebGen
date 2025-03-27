"use client";
import React, { useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Lookup from "@/data/Lookup";
import { Button } from "../ui/button";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

function SignInDialog({ openDialog, closeDialog }) {
  const { login } = useAuth();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse?.access_token}` } }
        );

        const googleUser = userInfo.data;
        
        const user = await login(googleUser);
        
        closeDialog(false);
        
        toast.success(`Welcome, ${user.name}!`);
      } catch (error) {
        console.error("Login error:", error);
        toast.error("Failed to authenticate with Google");
      }
    },
    onError: (errorResponse) => {
      console.error("Google login error:", errorResponse);
      toast.error("Google authentication failed");
    },
  });

  return (
    <Dialog open={openDialog} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <DialogDescription>
            <div className="flex flex-col justify-center items-center gap-3">
              <h2 className="font-bold text-2xl text-center text-white">
                {Lookup.SIGNIN_HEADING}
              </h2>
              <p className="mt-2 text-center">{Lookup.SIGNIN_SUBHEADING}</p>
              <Button
                className="bg-blue-500 text-white hover:bg-blue-400 mt-3"
                onClick={() => googleLogin()}
              >
                Sign In With Google
              </Button>
              <p>{Lookup.SIGNIn_AGREEMENT_TEXT}</p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default SignInDialog;