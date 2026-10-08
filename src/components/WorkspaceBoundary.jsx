import { Component } from "react";
import "./WorkspaceBoundary.css";

export default class WorkspaceBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <section className="workspace">
        <div className="workspace-fallback">
          <div className="hud-error" role="alert">
            ! Workspace failed to render. Submit a URL to retry.
          </div>
        </div>
      </section>
    );
  }
}
