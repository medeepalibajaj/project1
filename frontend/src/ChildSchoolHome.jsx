import { useState } from "react";
import {
  GraduationCap,
  ShieldCheck,
  Bus,
  BookOpen,
  Palette,
  Trophy,
  Users,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Star,
  Clock,
  Heart,
  BrainCircuit
} from "lucide-react";
import "./child-school-home.css";

const classes = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"
];

const highlights = [
  { icon: GraduationCap, title: "CBSE Pattern Curriculum", text: "Structured academic program aligned with NCERT guidelines for strong foundational learning." },
  { icon: ShieldCheck, title: "Safe & Secure Campus", text: "CCTV surveillance, verified staff, and child-safe infrastructure for complete peace of mind." },
  { icon: Bus, title: "GPS-Enabled Transport", text: "Air-conditioned school buses with female attendants and real-time GPS tracking." },
  { icon: BookOpen, title: "Smart Digital Classes", text: "Interactive boards, audio-visual aids, and tablet-based learning for modern education." },
  { icon: Palette, title: "Co-Curricular Activities", text: "Art, music, dance, yoga, and sports to nurture creativity and physical fitness." },
  { icon: Trophy, title: "Value-Based Education", text: "Moral science, discipline, and respect for Indian culture embedded in daily learning." },
];

const stats = [
  { label: "Years of Excellence", value: "15+" },
  { label: "Happy Students", value: "1,200+" },
  { label: "Qualified Teachers", value: "45+" },
  { label: "Student-Teacher Ratio", value: "25:1" },
];

export default function ChildSchoolHome({ onLogin }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="schoolHome">
      {/* Top Bar */}
      <div className="topBar">
        <div className="topBarInner">
          <span><Phone size={14} /> +91-98765 43210</span>
          <span><Mail size={14} /> info@brightfutureschool.edu.in</span>
          <span><MapPin size={14} /> New Delhi, India</span>
        </div>
      </div>

      {/* Navbar */}
      <nav className="schoolNav">
        <div className="navInner">
          <div className="schoolBrand">
            <div className="schoolLogo">
              <GraduationCap size={32} />
            </div>
            <div>
              <h1>Bright Future Primary School</h1>
              <p>विद्या ददाति विनयम् &nbsp;|&nbsp; Knowledge Gives Humility</p>
            </div>
          </div>

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <span />
            <span />
            <span />
          </button>

          <div className={`schoolMenu ${menuOpen ? "open" : ""}`}>
            <a href="#about">About Us</a>
            <a href="#academics">Academics</a>
            <a href="#facilities">Facilities</a>
            <a href="#admissions">Admissions</a>
            <a href="#contact">Contact</a>
            <button className="loginBtn" onClick={onLogin}>
              Admin Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="schoolHero">
        <div className="heroOverlay" />
        <div className="heroContent">
          <div className="admissionPill">
            <Star size={16} fill="currentColor" /> Admissions Open 2026-27
          </div>
          <h2>Building Bright Futures with Indian Values & Modern Education</h2>
          <p>
            A nurturing environment where young minds blossom through academic excellence,
            cultural roots, and holistic development. Affiliated with CBSE pattern and
            committed to shaping responsible citizens of tomorrow.
          </p>
          <div className="heroActions">
            <a href="#admissions" className="primaryBtn">
              Enquire Now <ArrowRight size={18} />
            </a>
            <a href="#about" className="secondaryBtn">
              Explore Campus
            </a>
          </div>

          <div className="trustPills">
            <span><ShieldCheck size={16} /> CBSE Pattern</span>
            <span><Users size={16} /> Experienced Faculty</span>
            <span><Heart size={16} /> Child-First Approach</span>
          </div>
        </div>
      </header>

      <main className="schoolMain">
        {/* Quick Stats */}
        <section className="statsBar">
          {stats.map((s) => (
            <div className="statItem" key={s.label}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </section>

        {/* About */}
        <section className="schoolSection" id="about">
          <div className="sectionHeader">
            <span>About Our School</span>
            <h2>Where Tradition Meets Innovation</h2>
            <p>
              Established in 2010, Bright Future Primary School is a premier institution
              dedicated to providing quality education rooted in Indian cultural values.
              We believe every child is unique and deserves an environment that fosters
              curiosity, confidence, and compassion.
            </p>
          </div>

          <div className="aboutGrid">
            <div className="aboutCard saffron">
              <b>Academic Excellence</b>
              <span>NCERT-based curriculum with continuous evaluation and remedial classes for every child.</span>
            </div>
            <div className="aboutCard green">
              <b>Cultural Values</b>
              <span>Daily prayers, festival celebrations, yoga sessions, and moral science classes.</span>
            </div>
            <div className="aboutCard blue">
              <b>Future Ready</b>
              <span>STEM activities, computer literacy, and communication skills from an early age.</span>
            </div>
          </div>
        </section>

        {/* Academics / Classes */}
        <section className="schoolSection altBg" id="academics">
          <div className="sectionHeader">
            <span>Academic Programs</span>
            <h2>Classes We Offer</h2>
            <p>
              From early childhood education to primary grades, we ensure smooth
              progression with age-appropriate learning methodologies.
            </p>
          </div>
          <div className="classGrid">
            {classes.map((c) => (
              <div className="classCard" key={c}>
                <GraduationCap size={28} />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Facilities / Why Choose */}
        <section className="schoolSection" id="facilities">
          <div className="sectionHeader">
            <span>Why Parents Trust Us</span>
            <h2>World-Class Facilities for Growing Minds</h2>
          </div>
          <div className="featureGrid">
            {highlights.map(({ icon: Icon, title, text }) => (
              <div className="featureCard" key={title}>
                <div className="featureIconWrap">
                  <Icon size={26} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Admissions CTA */}
        <section className="schoolSection altBg" id="admissions">
          <div className="admissionBanner">
            <div className="admissionText">
              <h2>Admissions Open for Session 2026-2027</h2>
              <p>
                Limited seats available for Nursery to Class 5. Visit our campus,
                meet our educators, and experience the Bright Future difference.
                Scholarship programs available for meritorious students.
              </p>
              <div className="admissionMeta">
                <span><Clock size={16} /> School Hours: 8:00 AM – 2:00 PM</span>
                <span><MapPin size={16} /> Sector 12, Dwarka, New Delhi</span>
              </div>
              <div className="heroActions" style={{ marginTop: "22px" }}>
                <a href="#contact" className="primaryBtn">
                  Book a Campus Tour <ArrowRight size={18} />
                </a>
              </div>
            </div>
            <div className="admissionVisual">
              <div className="visualCircle">
                <BrainCircuit size={64} />
                <span>Enroll Today</span>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="schoolSection" id="contact">
          <div className="sectionHeader">
            <span>Get in Touch</span>
            <h2>We Would Love to Hear From You</h2>
          </div>
          <div className="contactGrid">
            <div className="contactCard">
              <Phone size={22} />
              <b>Call Us</b>
              <span>+91-98765 43210</span>
              <span>+91-011-1234-5678</span>
            </div>
            <div className="contactCard">
              <Mail size={22} />
              <b>Email Us</b>
              <span>info@brightfutureschool.edu.in</span>
              <span>admissions@brightfutureschool.edu.in</span>
            </div>
            <div className="contactCard">
              <MapPin size={22} />
              <b>Visit Us</b>
              <span>Sector 12, Dwarka</span>
              <span>New Delhi – 110078</span>
            </div>
            <div className="contactCard">
              <Clock size={22} />
              <b>Office Hours</b>
              <span>Mon – Sat: 8:00 AM – 4:00 PM</span>
              <span>Sunday: Closed</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="schoolFooter">
        <div className="footerInner">
          <div className="footerBrand">
            <div className="schoolLogo" style={{ marginBottom: "12px" }}>
              <GraduationCap size={28} />
            </div>
            <h3>Bright Future Primary School</h3>
            <p>Shaping young minds with knowledge, values, and integrity since 2010.</p>
          </div>
          <div className="footerLinks">
            <b>Quick Links</b>
            <a href="#about">About Us</a>
            <a href="#academics">Academics</a>
            <a href="#facilities">Facilities</a>
            <a href="#admissions">Admissions</a>
          </div>
          <div className="footerLinks">
            <b>Resources</b>
            <span>Parent Portal</span>
            <span>Fee Structure</span>
            <span>Academic Calendar</span>
            <span>Transport Routes</span>
          </div>
          <div className="footerLinks">
            <b>Legal</b>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Child Safety Policy</span>
          </div>
        </div>
        <div className="footerBottom">
          © {new Date().getFullYear()} Bright Future Primary School. All rights reserved. | Made with care in India.
        </div>
      </footer>
    </div>
  );
}
