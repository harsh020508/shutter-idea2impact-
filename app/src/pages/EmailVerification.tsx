import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailOpen } from "lucide-react";

export default function EmailVerification() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfaf9] p-4">
      <Card className="w-full max-w-sm border-[#f2f0ed] shadow-sm text-center">
        <CardHeader className="pb-2 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#ff3e00]/10 flex items-center justify-center text-[#ff3e00] mb-4">
            <MailOpen className="w-6 h-6" />
          </div>
          <CardTitle className="text-[24px] font-bold text-[#121212]">Verify Email</CardTitle>
          <CardDescription className="text-[12px] text-[#848281] mt-1">Please confirm your email address</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-6">
          <p className="text-[13px] text-[#474645] leading-relaxed">
            We have sent a verification link to your email address. 
            Please open the link to activate your account and access the dashboard.
          </p>

          <div className="text-center text-[12px] text-[#848281] border-t border-[#f2f0ed] pt-4">
            Already verified?{" "}
            <Link to="/login" className="text-[#ff3e00] hover:underline font-medium">
              Log In here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
