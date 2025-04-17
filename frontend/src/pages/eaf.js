import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import mammoth from "mammoth";
import { auth, storage, db } from '../firebase';
import { ref, listAll, uploadBytes, getDownloadURL, getMetadata, deleteObject } from 'firebase/storage';
import { generateEAF } from "../api/api";
import { getAuth, updatePassword, validatePassword, updateEmail, deleteUser } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; 
import { toast } from "react-toastify";

// ==================== EAF FILES (Dashboard) ====================
function EafFiles(props) {
    const user = props.userLoggedIn;
    const navigate = useNavigate();

    const [documents, setDocuments] = useState([]); // Documents list with metadata
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [documentHTML, setDocumentHTML] = useState('');

    const handleDelete = (id) => {
        const docToDelete = documents.find((doc) => doc.id === id);

        // handle if selected document is deleted
        if (docToDelete.id === selectedDocument.id) {
            setSelectedDocument(null);
        }

        // delete documents
        setDocuments(documents.filter((doc) => doc.id !== id));
        DeleteDocument(user, docToDelete.name);
    };

const handleSelect = async (document) => {
    if (!document || !document.url) {
        console.error("Invalid document selection.");
        return;
    }

    setSelectedDocument(document);

    try {
        const response = await fetch(document.url, { mode: 'cors' });

        if (!response.ok) {
            console.error("Error fetching document:", response.statusText);
            return;
        }

        const blob = await response.blob();
        const reader = new FileReader();

        reader.onload = async function () {
            try {
                const arrayBuffer = reader.result;
                const result = await mammoth.convertToHtml({ arrayBuffer });

                if (result && result.value) {
                    setDocumentHTML(result.value);
                } else {
                    console.error("Failed to convert document to HTML.");
                }
            } catch (error) {
                console.error("Error converting document:", error);
            }
        };

        reader.readAsArrayBuffer(blob);
    } catch (error) {
        console.error("Error processing document:", error);
    }
};

const handleDownload = async (document) => {
    try {
      const response = await fetch(document.url);
      const blob = await response.blob();
      // Create a new Blob with the proper MIME type for a Word document
      const docxBlob = new Blob([blob], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const downloadUrl = window.URL.createObjectURL(docxBlob);
      // Append ".docx" if not already present in the stored filename
      const fileName = document.name.endsWith('.docx')
        ? document.name
        : document.name + '.docx';
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };
  


    const handleGenerate = () => {
        navigate('/chat');
    };

    // Fetch list of documents from storage/database
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const docs = await GetDocuments(user);
		docs.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest to oldest
                setDocuments(docs);
            } catch (error) {
                console.error("Error fetching documents: ", error);
            }
        };

        if (user) {
            fetchDocs();
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col">
            {/* Top Navigation */}
            <section>
                <EafLinking selected="files" nav={navigate} user={user} />
            </section>

            {/* Welcome Section */}
            <div className="text-center mt-16">
                <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-lg text-gray-600">Welcome{user?.displayName ? ', ' + user?.displayName: ''}</p>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center mt-8 mb-6">
                <button
                    onClick={handleGenerate}
                    className="px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold rounded-lg shadow hover:opacity-90"
                >
                    Generate New Document
                </button>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-3 gap-6 px-8">
                {/* Left Panel: Document List */}
                <div className="col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Documents</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b text-gray-600">
                                <th className="text-left p-2">Name</th>
                                <th className="text-left p-2">Date</th>
                                <th className="text-left p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center text-gray-500 py-4">
                                        Files you generate will appear here. Let's get started!
                                    </td>
                                </tr>
                            ) : (
                                documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-100">
                                        <td className="p-2 text-gray-800">{doc.name.replace(/\.docx$/, '')}</td>
                                        <td className="p-2 text-gray-600">{doc.date}</td>
                                        <td className="p-2 flex space-x-2">
                                            <button
                                                onClick={() => handleSelect(doc)}
                                                className="px-3 py-1 bg-green-500 text-white rounded shadow hover:bg-green-600"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="px-3 py-1 bg-red-500 text-white rounded shadow hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Right Panel: Document Viewer */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Document Viewer</h2>
                    {selectedDocument ? (
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{selectedDocument.name.replace(/\.docx$/, '')}</h3>
                            <div
                                dangerouslySetInnerHTML={{ __html: documentHTML.replace(/<input[^>]*>/g, '<input style="display:none;" />') }}
                                style={{ fontSize: '0.7rem' }}
                                className="transform scale-10 smaller-doc border-2 border-gray-500 p-4 mb-3"
                            />
                            <a
                                href={selectedDocument.url}
                                download="EAF.docx"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 block text-center"
                                onClick={() => navigate('/user-files')}
                            >
                                Download EAF
                            </a>
                        </div>
                    ) : (
                        <p className="text-gray-500">Select a document to view its content.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

async function DocToHTML(docURL) {
    try {
        const response = await fetch(docURL, { mode: 'cors' });
        if (!response.ok) {
            throw new Error("Failed to fetch document.");
        }
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        return result;
    } catch (error) {
        console.error("Error converting doc to HTML:", error);
        return null;
    }
}

async function GetDocuments(user) {
    const userFilesRef = ref(storage, `documents/${user.uid}/`);

    try {
        const result = await listAll(userFilesRef);
        const fileDetails = [];
        let id = 0;

        for (const item of result.items) {
            const metadata = await getMetadata(item);
            const name = item.name;
            const creationDate = metadata.updated;
            id++;
            const url = await getDownloadURL(item);

            fileDetails.push({
                id,
                name,
                date: new Date(creationDate).toLocaleString(),
                url
            });
        }

        return fileDetails;

    } catch (error) {
        console.error("Error retrieving user files: ", error);
        return [];
    }
}

async function DeleteDocument(user, fileName) {
    try {
        const fileRef = ref(storage, `documents/${user.uid}/${fileName}`);
        await deleteObject(fileRef);
        console.log(`Successfully deleted ${fileName}`);
    } catch (error) {
        console.error("Error deleting file: ", error);
    }
}

// ==================== EAF GENERATOR (Chat) ====================
function EafChat(props) {
    const user = props.userLoggedIn;
    const navigate = useNavigate();

    // New state: Budget field, today’s date preset, loading and report modal
    const [incident, setIncident] = useState('');
    const [budget, setBudget] = useState('');
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
    const [brief_description, setDescription] = useState('');
    const [generatedResponse, setGeneratedResponse] = useState(null);
    const [generatedText, setGeneratedText] = useState("Hi");
    const [htmlContent, setHtmlContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const sendMessage = async () => {
        if (incident.trim() !== "" && date.trim() !== "" && brief_description.trim() !== "" && budget.trim() !== "") {
            setIsLoading(true);
            try {
                // Pass budget as an extra parameter
                const response = await generateEAF(incident, date, brief_description, budget);
                console.log(response);
                //const fullDescription = response.full_description;
                setGeneratedText(response);

                
                // Assume response is a URL link
                let downloadLink = response;

                const data = { incident, date, brief_description, budget, response };

                const response2 = await fetch('http://148.113.202.141:3001/create_word_doc', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                });

                if (!response2.ok) {
                  // Show failure toast
                  toast.error("Failed to generate EAF.");
                  throw new Error("Failed to generate document");
                } else {
                  // Show success toast
                  toast.success("EAF generated successfully!");
                }

                const blob = await response2.blob();
                downloadLink = URL.createObjectURL(blob);

                setGeneratedResponse(downloadLink);
            } catch (error) {
                console.error("Error generating EAF:", error);
                setGeneratedResponse("Failed to generate response.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        const fetchHtmlContent = async () => {
            if (generatedResponse && generatedResponse !== "Failed to generate response.") {
                const html = await DocToHTML(generatedResponse);
                if (html && html.value) {
                    setHtmlContent(html.value);
                } else {
                    console.error("Failed to convert document to HTML.");
                }
            }
        };

        fetchHtmlContent();
    }, [generatedResponse]);

    // Function to log issue (stubbed for firebase logging)
    const handleReportSubmit = async (issueText) => {
       console.log(generatedText);
    
      const report_data = {
        incident,
        date,
        brief_description,
        budget,
        response: generatedText
      };
      await reportIssue(issueText, report_data, user, navigate);
    };

    return (
        //<div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 flex flex-col justify-center items-center pt-20">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 pt-20">
            {/* EAF Linking Section */}
            <section>
                <EafLinking selected="chat" nav={navigate} user={user} />
            </section>

            <div className="flex w-11/12 max-w-6xl p-6 bg-white rounded-lg shadow-lg mx-auto">
                {/* Form Section */}
                <div className="w-5/12 bg-gray-900 p-6 rounded-lg shadow-md">
                    <h1 className="text-white text-lg font-bold text-center pb-4">EAF Generator</h1>
                    <form className="flex flex-col">
                        <label className="text-white text-sm pb-3">Incident</label>
                        <input 
                            type="text" 
                            placeholder="Enter Incident Name" 
                            value={incident} 
                            onChange={(e) => setIncident(e.target.value)} 
                            className="text-white w-full text-sm p-2 rounded-lg bg-gray-700" 
                        />
                        <label className="text-white text-sm pt-3 pb-3">Budget / Amount Requested</label>
                        <input 
                            type="text" 
                            placeholder="Enter budget or amount requested" 
                            value={budget} 
                            onChange={(e) => setBudget(e.target.value)} 
                            className="text-white w-full text-sm p-2 rounded-lg bg-gray-700" 
                        />
                        <label className="text-white text-sm pt-3 pb-3">Date of Request</label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)} 
                            className="text-white text-sm p-2 rounded-lg bg-gray-700" 
                        />
                        <label className="text-white text-sm pt-3 pb-3">Description of Expenditure</label>
                        <textarea
                            className="rounded p-2 h-32 resize-none w-full text-sm text-white bg-gray-700"
                            placeholder="Provide your description of expenditure"
                            value={brief_description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </form>
                    <span className="flex justify-end">
                        <button
                            onClick={sendMessage}
                            disabled={isLoading}
                            className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {isLoading ? 'Generating...' : 'Generate EAF'}
                        </button>
                    </span>
                </div>
                
                {/* Response Panel */}
                <div className="w-7/12 ml-6 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-3">Generated EAF:</h3>
                    {generatedResponse ? (
                        <>
                            <div 
                                dangerouslySetInnerHTML={{ __html: htmlContent.replace(/<input[^>]*>/g, '<input style="display:none;" />') }} 
                                style={{ fontSize: '0.5rem' }}
                                className="transform scale-10 smaller-doc border-2 border-gray-500 p-4 mb-3"
                            />
                            <a 
                                href={generatedResponse} 
                                download="EAF.docx" 
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 block text-center"
                                onClick={() => navigate('/user-files')}
                            >
                                Download EAF
                            </a>
                            <button
                                onClick={() => SaveDocument(user, generatedResponse, incident, navigate)}
                                className="mt-3 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 block text-center"
                            >
                                Save to Database
                            </button>
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="mt-3 w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 block text-center"
                            >
                                Report Issue
                            </button>
                        </>
                    ) : (
                        <p className="text-gray-500">Generated response will appear here...</p>
                    )}
                </div>
            </div>
            {showReportModal && (
                <ReportIssueModal 
                    onClose={() => setShowReportModal(false)}
                    onSubmit={(issueText) => handleReportSubmit(issueText)}
                />
            )}
        </div>
    );
}

// Modal for reporting issues in generated output
function ReportIssueModal({ onClose, onSubmit }) {
    const [issueText, setIssueText] = useState("");
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center"
            onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white p-6 rounded-lg shadow-md max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4">Report Issue</h2>
                <textarea 
                    className="w-full border border-gray-300 p-2 rounded mb-4"
                    placeholder="Describe the issue with the generated output..."
                    value={issueText}
                    onChange={(e) => setIssueText(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                    <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                    <button onClick={() => onSubmit(issueText)} className="bg-red-500 text-white px-4 py-2 rounded">Submit</button>
                </div>
            </div>
        </div>
    );
}

// Save user document generated from AI to firebase
async function SaveDocument(user, documentURL, fileName,navigate) {
    try {
        // Ensure fileName ends with .docx
        const finalFileName = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;

        const response = await fetch(documentURL);
        const blob = await response.blob();
        const storageRef = ref(storage, `documents/${user.uid}/${finalFileName}`);
        await uploadBytes(storageRef, blob);

        // Show success toast
        toast.success("Document saved successfully!");
        navigate("/user-files");
    } catch (error) {
        // Show error toast
        toast.error("We encountered an error while saving your file.");
        console.error("Error uploading file: ", error);
    }
}


async function reportIssue(issueText, data, user, navigate) {
  try {
    // 'data' should include { incident, date, brief_description, budget, response }
    await addDoc(collection(db, "reported_issues"), {
      ...data,
      issueText,
      userId: user.uid,
      reportedAt: serverTimestamp(),
    });

    toast.success("Issue reported successfully!");
    // Redirect to dashboard
    navigate("/user-files");
  } catch (error) {
    console.log("Error reporting issue: " + error.message);
    toast.error("Error reporting issue: " + error.message);
  }
}

// ==================== SETTINGS (Account Management) ====================
function EafSettings(props) {
    const navigate = useNavigate();
    const user = auth.currentUser;
    const [showPassModal, setShowPass] = useState(false);
    const [showEmailModal, setShowEmail] = useState(false);
    const [showDeleteModal, setShowDelete] = useState(false);

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 pt-28 flex flex-col items-center">
                {/* EAF Linking Section */}
                <section className="w-full">
                    <EafLinking selected="settings" nav={navigate} user={user} />
                </section>
                
                {/* Account Management Card */}
                <div className="w-11/12 max-w-4xl bg-white p-8 rounded-lg shadow-lg mt-10">
                    <h1 className="text-4xl font-bold text-gray-800 pb-4 border-b mb-6">Account Management</h1>
                    
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-700">Reset Password</h2>
                                <p className="text-gray-500">Update your account password.</p>
                            </div>
                            <button 
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => setShowPass(true)}
                            >
                                Reset
                            </button>
                        </div>
                        <hr/>
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-700">Change Email</h2>
                                <p className="text-gray-500">Update your email address.</p>
                            </div>
                            <button 
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => setShowEmail(true)}
                            >
                                Change
                            </button>
                        </div>
                        <hr/>
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-700">Delete Account</h2>
                                <p className="text-gray-500">Permanently delete your account and all associated files.</p>
                            </div>
                            <button 
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => setShowDelete(true)}
                            >
                                Delete
                            </button>
                        </div>
                        <hr/>
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-700">User Info</h2>
                            <p className="text-gray-600">Name: {user.displayName}</p>
                            <p className="text-gray-600">Email: {user.email}</p>
                            <p className="text-gray-600">Email Verified: {user.emailVerified ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                </div>
            </div>
            {showPassModal && <ModalPassword onClose={() => setShowPass(false)} />}
            {showEmailModal && <ModalEmail onClose={() => setShowEmail(false)} />}
            {showDeleteModal && <ModalDeleteAccount onClose={() => setShowDelete(false)} />}
        </>
    );
}

// ==================== MODAL COMPONENTS (Password, Email, Delete Account) ====================
function ModalPassword(props) {
    const modalRef = useRef();
    const [previousPassword, setPrevPassword] = useState('');
    const [newPassword1, setNewPass1] = useState('');
    const [newPassword2, setNewPass2] = useState('');
    const [error, setError] = useState('');

    const closeModal = (e) => {
        if (modalRef.current === e.target) {
            props.onClose();
        }
    };

    const handlePassChange = async (e) => {
        e.preventDefault();
        const passwordRegEx = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        const passwordMinLngth = 8;
        const passwordMaxLngth = 16;
        const auth = getAuth();
        const user = auth.currentUser;
        const status = validatePassword(auth, previousPassword);
        let issueOccured = false;

        if(!status.isValid) {
            setError('* Previous password is incorrect');
            issueOccured = true;
        }
        else if (newPassword1 !== newPassword2 && !issueOccured) {
            setError('* New passwords must match.');
            issueOccured = true;
        } 
        else if ((previousPassword === '' || newPassword1 === '' || newPassword2 === '') && !issueOccured) {
            setError('* All values must be filled in.');
            issueOccured = true;
        }
        else if ((newPassword1.length <= passwordMinLngth || newPassword1.length > passwordMaxLngth) && !issueOccured) {
            setError('* New password must be between 8 and 16 characters.');
            issueOccured = true;
        }
        else if ((!passwordRegEx.test(newPassword1) || !passwordRegEx.test(newPassword2)) && !issueOccured) {
            setError('* Password must have at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.');
            issueOccured = true;
        }

        if (issueOccured) {
            alert(error);
            setPrevPassword('');
            setNewPass1('');
            setNewPass2('');
            return;
        }

        try {
            await updatePassword(user, newPassword1);
            alert('Password has been updated');
        } catch (err) {
            setError('* ' + err.message.split('Firebase:')[1]);
            setPrevPassword('');
            setNewPass1('');
            setNewPass2('');
        }
    };

    return (
        <div ref={modalRef} onClick={closeModal} className='fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center'>
            <div className='bg-white rounded-lg px-20 py-10 flex flex-col gap-5 items-center mx-4'>
                <button onClick={props.onClose} className='place-self-end text-xl text-red-900 font-extrabold'>X</button>
                <h1 className='text-3xl font-bold pb-2'>Change Password</h1>
                <form onSubmit={handlePassChange}>
                    <label htmlFor='password'>Previous Password</label>
                    <input
                        id='password'
                        type='password'
                        value={previousPassword}
                        onInput={(e) => setPrevPassword(e.target.value)}
                        placeholder='Enter your previous password'
                        required
                        className='w-full px-4 py-3 bg-gray-200 rounded-lg my-3'    
                    />
                    <label htmlFor='newPassword'>New Password</label>
                    <input
                        id='newPassword'
                        type='password'
                        value={newPassword1}
                        onInput={(e) => setNewPass1(e.target.value)}
                        placeholder='Enter your new password'
                        required
                        className='w-full px-4 py-3 bg-gray-200 rounded-lg my-3'    
                    />
                    <label htmlFor='repeatPassword'>Repeat New Password</label>
                    <input
                        id='repeatPassword'
                        type='password'
                        value={newPassword2}
                        onInput={(e) => setNewPass2(e.target.value)}
                        placeholder='Repeat your new password'
                        required
                        className='w-full px-4 py-3 bg-gray-200 rounded-lg my-3'    
                    />
                    <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold my-2 py-2 px-4 rounded'>Change Password</button>
                </form>
            </div>
        </div>
    );
}

function ModalEmail(props) {
    const modalRef = useRef();
    const [newEmail, setNewEmail] = useState('');
    const [password, setPass] = useState('');
    const [error, setError] = useState('');

    const closeModal = (e) => {
        if (modalRef.current === e.target) {
            props.onClose();
        }
    };

    const handleEmailChange = async (e) => {
        e.preventDefault();
        const auth = getAuth();
        const user = auth.currentUser;
        const status = validatePassword(auth, password);
        let issueOccured = false;

        if(!status.isValid) {
            setError('* Password is incorrect');
            issueOccured = true;
        }
        else if ((password === '' || newEmail === '') && !issueOccured) {
            setError('* All values must be filled in.');
            issueOccured = true;
        }

        if (issueOccured) {
            alert(error);
            setNewEmail('');
            setPass('');
            return;
        }

        try {
            await updateEmail(user, newEmail);
            alert('Your Email has been updated');
        } catch (err) {
            setError('* ' + err.message.split('Firebase:')[1]);
            setNewEmail('');
            setPass('');
        }
    };

    return (
        <div ref={modalRef} onClick={closeModal} className='fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center'>
            <div className='bg-white rounded-lg px-20 py-10 flex flex-col gap-5 items-center mx-4'>
                <button onClick={props.onClose} className='place-self-end text-xl text-red-900 font-extrabold'>X</button>
                <h1 className='text-3xl font-bold pb-2'>Change Email</h1>
                <form onSubmit={handleEmailChange}>
                    <label htmlFor='newEmail'>New Email</label>
                    <input
                        id='newEmail'
                        type='text'
                        value={newEmail}
                        onInput={(e) => setNewEmail(e.target.value)}
                        placeholder='Enter your new email'
                        required
                        className='w-full px-4 py-3 bg-gray-200 rounded-lg my-3'    
                    />
                    <label htmlFor='Password'>Password</label>
                    <input
                        id='Password'
                        type='password'
                        value={password}
                        onInput={(e) => setPass(e.target.value)}
                        placeholder='Enter your password'
                        required
                        className='w-full px-4 py-3 bg-gray-200 rounded-lg my-3'    
                    />
                    <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold my-2 py-2 px-4 rounded'>Change Email</button>
                </form>
            </div>
        </div>
    );
}

function ModalDeleteAccount(props) {
    const modalRef = useRef();
    const [password, setPass] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const closeModal = (e) => {
        if (modalRef.current === e.target) {
            props.onClose();
        }
    };

    const handleAccountDelete = async (e) => {
        e.preventDefault();
        const auth = getAuth();
        const user = auth.currentUser;
        const status = validatePassword(auth, password);
        let issueOccured = false;

        if(!status.isValid) {
            setError('* Password is incorrect');
            issueOccured = true;
        }
        else if (password === '' && !issueOccured) {
            setError('* All values must be filled in.');
            issueOccured = true;
        }

        if (issueOccured) {
            alert(error);
            setPass('');
            return;
        }

        try {
            await deleteUser(user);
            alert('Your account has been deleted');
            navigate('/');
            window.location.reload();
        } catch (err) {
            setError('* ' + err.message.split('Firebase:')[1]);
            setPass('');
        }
    };

    return (
        <div ref={modalRef} onClick={closeModal} className='fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center'>
            <div className='bg-white rounded-lg px-20 py-10 flex flex-col gap-5 items-center mx-4'>
                <button onClick={props.onClose} className='place-self-end text-xl text-red-900 font-extrabold'>X</button>
                <h1 className='text-3xl font-bold pb-2'>Delete Your Account</h1>
                <form onSubmit={handleAccountDelete}>
                    <label htmlFor='Password'>Password</label>
                    <input
                        id='Password'
                        type='password'
                        value={password}
                        onInput={(e) => setPass(e.target.value)}
                        placeholder='Enter your password to delete your account'
                        required
                        className='w-full px-4 py-3 bg-gray-200 rounded-lg my-3'    
                    />
                    <div id='FinalDelete'>
                        <p>Deleting your account is <b>permanent</b> and will delete any files stored on this website's database. Are you sure you'd like to proceed?</p>
                        <button className='bg-red-500 hover:bg-red-700 text-white font-bold my-2 py-2 px-4 rounded'>Delete My Account</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ==================== EAF LINKING (Navigation) ====================
function EafLinking(props) {
    const navigate = props.nav;
    const user = props.user;
    const [hidden, setHidden] = useState(true);
    const [showHelpModal, setShowHelp] = useState(false);

    const selectedStyle = 'bg-white text-black rounded p-2';
    let homeStr, filesStr, chatStr, settingsStr;
    homeStr = filesStr = chatStr = settingsStr = 'hover:bg-slate-300 hover:text-black hover:rounded p-2';

    switch (props.selected) {
        case 'home':
            homeStr = selectedStyle;
            break;
        case 'files':
            filesStr = selectedStyle;
            break;
        case 'chat':
            chatStr = selectedStyle;
            break;
        case 'settings':
            settingsStr = selectedStyle;
            break;
        default:
            break;
    }

    return (
        <nav className="bg-blue-900 text-white fixed w-full z-20 top-0">
            <div className="flex justify-between items-center p-2">
                <ul className="flex items-center space-x-4">
                    <li className={homeStr}>
                        <Link to="/">Home</Link>
                    </li>
                    <li className={filesStr}>
                        <Link to="/user-files">Files</Link>
                    </li>
                    <li className={chatStr}>
                        <Link to="/chat">Create EAF</Link>
                    </li>
                </ul>
                <div className='relative select-none'
                    onMouseEnter={() => setHidden(false)}
                    onMouseLeave={() => setHidden(true)}>
                    <div className="flex items-center border border-gray-400 pl-4 pr-5 py-2 rounded cursor-pointer font-bold">
                        My Account
                        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 10L12 15L17 10" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    {!hidden &&
                        <div className="text-black rounded border-gray-500 bg-white absolute right-0 w-64 shadow-md">
                            <ul>
                                <Link to="/settings">
                                    <li className='cursor-pointer hover:bg-gray-300 hover:rounded p-5'>
                                        Settings
                                    </li>
                                </Link>
                                <li className='cursor-pointer hover:bg-gray-300 hover:rounded p-5'
                                    onClick={() => setShowHelp(true)}>
                                    Help
                                </li>
                                {showHelpModal && <HelpModal onClose={() => setShowHelp(false)} />}
                                <hr />
                                <li onClick={() => SignOut(navigate)} className="cursor-pointer hover:bg-red-200 hover:rounded p-5">Sign Out</li>
                            </ul>
                        </div>
                    }
                </div>
            </div>
        </nav>
    );
}

function SignOut(navigate) {
    auth.signOut();
    navigate('/');
    window.location.reload();
}

function HelpModal(props) {
    const modalRef = useRef();
    const navigate = useNavigate();

    const closeModal = (e) => {
        if (modalRef.current === e.target) {
            props.onClose();
        }
    };

    return (
        <div ref={modalRef} onClick={closeModal} className='fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center'>
            <div className='mt-10 flex flex-col gap-5 text-gray-800 max-w-2xl'>
                <div className='bg-white rounded-lg px-20 py-10 flex flex-col gap-5 items-center mx-4'>
                    <button onClick={props.onClose} className='place-self-end text-xl text-red-900 font-extrabold'>X</button>
                    <h1 className='text-3xl font-bold pb-2'>Help</h1>
                    <h2 className='p-2'>This website assists you in creating EAF forms more likely to be accepted by your local government. To generate a form, head to the Create EAF tab once signed in. Simply enter your incident name, budget, date (prefilled), and a short description. Then, our system generates the optimal EAF form for your situation. Click below to proceed.</h2>
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold my-2 py-2 px-4 rounded"
                        onClick={(e) => { closeModal(e); navigate('/chat'); }}>
                        Generate an EAF!
                    </button>
                </div>
            </div>
        </div>
    );
}

export { EafFiles, EafChat, EafLinking, EafSettings };
