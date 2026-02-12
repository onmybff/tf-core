import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";

export default function Index() {
  const { profile } = useAuth();

  return (
    <div className="flex h-full flex-col items-center p-8 animate-fade-in">
      <h1 className="font-display text-5xl font-bold tracking-tight">TEAM FOCUS</h1>
      <p className="mt-3 text-lg text-muted-foreground">Virtual Entertainment Community</p>
      {profile && (
        <p className="mt-6 text-sm text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{profile.display_name || "User"}</span>
        </p>
      )}

      <Card className="mt-10 w-full max-w-2xl border-foreground/10">
        <CardContent className="py-8 px-8">
          <h2 className="font-display text-xl font-bold tracking-tight mb-6 text-center">
            TEAM FOCUS 커뮤니티 이용 규정
          </h2>

          <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
            <section>
              <h3 className="font-bold mb-2">제1조 (기본 원칙)</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>모든 이용자는 상호 존중을 기반으로 건전한 커뮤니티 환경을 유지해야 합니다.</li>
                <li>스팸, 광고, 욕설 및 부적절한 콘텐츠 등록을 금지합니다.</li>
                <li>운영진의 공지사항 및 운영 정책을 준수해야 합니다.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-bold mb-2">제2조 (운영 및 제재)</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>규정 위반 시 게시물 삭제, 경고 또는 서비스 이용 제한이 적용될 수 있습니다.</li>
                <li>반복적이거나 중대한 위반 행위는 사전 통보 없이 차단(벤) 처리될 수 있습니다.</li>
                <li>커뮤니티 질서 유지 및 보안을 위해 운영진은 필요한 관리 조치를 수행할 수 있습니다.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-bold mb-2">제3조 (계정 관리)</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>이용자는 본인의 계정 정보를 안전하게 관리할 책임이 있습니다.</li>
                <li>계정 공유, 타인 사칭 및 무단 사용은 금지됩니다.</li>
                <li>계정 보안 문제 발생 시 즉시 운영진에게 알려야 합니다.</li>
              </ol>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
