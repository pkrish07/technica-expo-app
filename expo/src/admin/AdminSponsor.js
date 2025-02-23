import React, { Component } from "react";
import axiosRequest from "../Backend.js";

import CreateChallengeModal from "./CreateChallengeModal";
import CreateSponsorModal from "./CreateSponsorModal";
import EditChallengeModal from "./EditChallengeModal";
import EditSponsorModal from "./EditSponsorModal";
import WarningModal from "./WarningModal";
import SubmitInputModal from "../components/SubmitInputModal";

import "../Admin.css";
import "../App.css";

import { library } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "../../node_modules/@fortawesome/fontawesome-free-regular";
import { faCaretDown, faCaretUp, faCheckSquare, faUpload } from "../../node_modules/@fortawesome/fontawesome-free-solid";
library.add(faUpload);
library.add(faCaretDown);
library.add(faCaretUp);
library.add(faCheckSquare);
library.add(faSquare);


/* Sponsor side of admin page */
class SponsorModule extends Component {
    constructor(props) {
      super(props);
      this.state = {
        textSearch: "",
        sponsors: [],
        viewable: true,
      };
    }
  
    loadCompanies() {
      axiosRequest.get("api/companies")
        .then((sponsors) => {
          this.setState({
            sponsors: sponsors,
          });
        });
    }
  
    toggleView() {
      if (this.state.viewable) {
        this.setState({
          viewable: false,
        });
        document.getElementById("sponsor-content").style.display = "none";
      } else {
        this.setState({
          viewable: true,
        });
        document.getElementById("sponsor-content").style.display = "block";
      }
    }
  
    deleteAllSponsors() {
      if (window.confirm("Are you sure you want to remove ALL sponsors from your database?")) {
        if (window.confirm("This action is not reversable.")) {
          axiosRequest.delete("api/companies/deleteAll")
            .then(() => {
              this.loadCompanies();
            });
        }
      }
    }
  
    seedChallengesFromDevpost(devpostUrl) {
      // Determine inputted URL or default server Devpost URL
      const params = devpostUrl == "" ? {} : { "devpostUrl": devpostUrl };
      axiosRequest.post("api/seed-challenges-from-devpost", params)
        .then(() => {
          this.loadCompanies();
        });
    }
  
    // Pull data for sponsor list
    componentWillMount() {
      this.loadCompanies();
    }
  
    render() {
      // Compress list by access_code to suit view
      let compressedSponsors = [];
      this.state.sponsors.forEach(elt => {
        // Check whether code is unique
        let codeSeen = false;
        compressedSponsors.forEach((sponsor) => {
          if (sponsor.access_code == elt.access_code) {
            codeSeen = true;
          }
        });
  
        if (codeSeen == false) {
          // Set new item
          compressedSponsors.push(
            {
              access_code: elt.access_code,
              company_name: elt.company_name,
              challenges: [],
              id: elt.company_id,
            },
          );
        }
  
        // Add challenge to corresponding sponsor
        let current_sponsor = null;
        compressedSponsors.forEach((sponsor) => {
          if (sponsor.access_code == elt.access_code) {
            current_sponsor = sponsor;
          }
        });
        if (elt.challenge_name != undefined) {
          current_sponsor.challenges.push({
            challenge: elt.challenge_name,
            id: elt.challenge_id,
            num_winners: elt.num_winners,
          });
        }
  
      });
  
      // Prepare sponsor list against filter (including sponsor name and challenges)
      let filteredSponsors = compressedSponsors;
      if (this.state.textSearch != "" && this.state.textSearch != undefined) {
        filteredSponsors = filteredSponsors.filter(elt => {
  
          let casedTextSearch = this.state.textSearch.toUpperCase();
  
          let chalSearch = false;
          elt.challenges.forEach(chal => {
            if (chal.challenge.toUpperCase().includes(casedTextSearch)) {
              chalSearch = true;
            }
          });
          return elt.company_name.toUpperCase().includes(casedTextSearch)
            || chalSearch;
        });
      }
  
      // Sort Sponsors
      filteredSponsors.sort((s1, s2) => {
        return (s1.company_name).localeCompare(s2.company_name);
      });
  
      return (
        <div className="card">
          <div className="card-header">
            <div className="d-flex">
              <h4>Sponsors ({this.state.sponsors.length})</h4>
              <span className="ml-auto">
                <button className="link-button"
                  type="button"
                  onClick={() => { this.toggleView(); }}>
                  {!this.state.viewable ? "Show" : "Hide"}
                </button>
              </span>
            </div>
          </div>
          <div className="card-body" id="sponsor-content">
            <CreateSponsorModal
              createID="modalCreateSponsor"
              onCreate={this.loadCompanies.bind(this)}
            />
            <button className="button button-primary m-b-m m-r-m"
              type="button"
              data-toggle="modal"
              data-target="#modalCreateSponsor"
            >
              Create New Sponsor
            </button>
            <button className="button button-warning m-b-m"
              type="button"
              data-toggle="modal"
              data-target="#companyWipeWarningModal"
            >
              Delete ALL Sponsors
            </button>
            <WarningModal modalId="companyWipeWarningModal" whatToDelete="Sponsors" deleteAll={this.deleteAllSponsors.bind(this)} />
            <button className="button button-primary m-b-m"
              type="button"
              data-toggle="modal"
              data-target="#seed-devpost-challenges"
            >
              Seed Sponsors/Challenges from Devpost
            </button>
            <SubmitInputModal
              modalId="seed-devpost-challenges"
              modalTitle="Seed Sponsors and Challenges from Devpost"
              bodyText="Give us your hackathon's Devpost link (with the https) and we'll seed your Expo App
                with all of your sponsors and challenges! Make sure you're following our Devpost naming guidelines
                (Ex: challenge_name - company_name)."
              inputLabel="Devpost Link"
              inputPlaceholder="https://bitcamp2019.devpost.com"
              isInputRequired={true}
              completeAction={(devpostUrl) => this.seedChallengesFromDevpost(devpostUrl)}
              submitText="Seed from Devpost"
            />
            <div className="form-group">
              <input type="text"
                id="txtSponsorSearch"
                className="form-control"
                placeholder="Search for a sponsor or challenge name..."
                onChange={(event) => this.setState({ textSearch: event.target.value })}
              />
            </div>
            {filteredSponsors.map((elt, key) => {
              return (
                <div className="sponsor-card" key={key}>
                  <div>
                    <div className="d-flex">
                      <h5>
                        {elt.company_name}
                      </h5>
                      <span className="ml-auto">
                        <EditSponsorModal
                          editID={"modalEditSponsor" + key.toString()}
                          sponsorCode={elt.access_code}
                          sponsorName={elt.company_name}
                          sponsorID={elt.id}
                          onEdit={this.loadCompanies.bind(this)}
                        />
                        <button className="link-button"
                          type="button"
                          data-toggle="modal"
                          data-target={"#modalEditSponsor" + key.toString()}
                        >
                          Edit Details
                          </button>
                      </span>
                    </div>
  
                    <div>
                      <CreateChallengeModal
                        createID={"modalCreateChallenge" + key.toString()}
                        company={elt.company_name}
                        sponsorID={elt.id}
                        onCreate={this.loadCompanies.bind(this)}
                      />
                      <button
                        className="link-button shrink-0"
                        type="button"
                        data-toggle="modal"
                        data-target={"#modalCreateChallenge" + key.toString()}
                      >
                        Create Challenge
                            </button>
                    </div>
  
                    {elt.challenges.map((challenge, i) => {
                      return (
                        <div>
                          {(i + 1).toString() + ") " + challenge.challenge + " "}
                          <EditChallengeModal
                            editID={"modalEditChallenge" + elt.access_code.toString() + i.toString()}
                            challengeTitle={challenge.challenge}
                            numWinners={challenge.num_winners}
                            challengeID={challenge.id}
                            sponsorID={elt.id}
                            onEdit={this.loadCompanies.bind(this)}
                          />
                          <button className="link-button"
                            type="button"
                            data-toggle="modal"
                            data-target={"#modalEditChallenge" + elt.access_code.toString() + i.toString()}
                          >
                            Edit
                            </button>
                        </div>
                      );
                    })}
                  </div>
                  <hr />
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  export default SponsorModule;