export default function AppBackground() {
    return (
        <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-[#050507]" />
            <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute top-40 -right-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute bottom-[-120px] left-1/3 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(250,204,21,0.08),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(168,85,247,0.08),transparent_45%)]" />
        </div>
    );
}
